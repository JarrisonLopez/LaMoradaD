import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  UsersService,
  ProfessionalProfile,
  NotAvailableProfile,
} from '../../services/users.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-professional-profile',
  standalone: true,
  imports: [
    CommonModule, RouterModule, NgOptimizedImage, ReactiveFormsModule,
    MatCardModule, MatChipsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSnackBarModule,
  ],
  templateUrl: './professional-profile.component.html',
  styleUrls: ['./professional-profile.component.css'],
})
export class ProfessionalProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(UsersService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  saving  = signal(false);
  data = signal<ProfessionalProfile | null>(null);
  error = signal<string | null>(null);
  editMode = signal(false);

  user = computed(() => this.auth.user());

  /** id de la URL (string) y del dueño logueado (string) */
  private urlId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  private meId  = computed(() => String(this.user()?.id ?? ''));

  /** Es dueño si el id de la URL coincide con su id */
  isOwner = computed(() => this.meId() !== '' && this.meId() === this.urlId());

  /** Puede editar si es dueño y su rol es psicólogo */
  canEdit = computed(() => this.isOwner() && this.user()?.role === 'psicologo');

  /** Nombre completo para cabecera */
  name = computed(() =>
    [this.data()?.user?.name, (this.data()?.user as any)?.lastName]
      .filter(Boolean)
      .join(' ')
  );

  /** Form tipado y NO-nullable (evita los warnings NG8107) */
  form = this.fb.nonNullable.group({
    specialty: this.fb.nonNullable.control<string>('', [Validators.maxLength(200)]),
    experienceYears: this.fb.nonNullable.control<number>(0),
    services: this.fb.nonNullable.control<string>(''),
    bio: this.fb.nonNullable.control<string>(''),
    photoUrl: this.fb.nonNullable.control<string>(''),
  });

  ngOnInit(): void {
    const id = this.urlId();
    // Cargar el perfil (si no existe, guardamos el error)
    this.api.getProfessionalProfile(id).subscribe({
      next: (res) => {
        if ((res as NotAvailableProfile)?.error) {
          this.error.set((res as NotAvailableProfile).message || 'Perfil no disponible');
          this.data.set(null);
          // Si el dueño entra a su propia URL y no hay perfil -> habilitamos edición para CREAR
          if (this.canEdit()) {
            this.editMode.set(true);
            this.error.set(null); // ocultamos la franja roja y dejamos crear
          }
        } else {
          const p = res as ProfessionalProfile;
          this.data.set(p);
          this.form.reset({
            specialty: p.specialty ?? '',
            experienceYears: p.experienceYears ?? 0,
            services: p.services ?? '',
            bio: p.bio ?? '',
            photoUrl: p.photoUrl ?? '',
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil.');
        this.loading.set(false);
      },
    });
  }

  /** Normaliza services: acepta CSV o JSON array */
  servicesArray(): string[] {
    const s = this.data()?.services;
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [String(s)];
    } catch {
      return String(s).split(',').map(x => x.trim()).filter(Boolean);
    }
  }

  enableEdit() {
    if (!this.canEdit()) return;
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
    const d = this.data();
    if (d) {
      this.form.reset({
        specialty: d.specialty ?? '',
        experienceYears: d.experienceYears ?? 0,
        services: d.services ?? '',
        bio: d.bio ?? '',
        photoUrl: d.photoUrl ?? '',
      });
    } else {
      // si no existía perfil, volvemos a valores vacíos
      this.form.reset({
        specialty: '',
        experienceYears: 0,
        services: '',
        bio: '',
        photoUrl: '',
      });
      // y mostramos otra vez el mensaje informativo
      this.error.set('El perfil consultado no existe o fue eliminado. Regresa al listado de profesionales.');
    }
  }

  /** Guardar (crea si no existe, actualiza si existe) */
  save() {
    if (!this.canEdit() || this.form.invalid) return;
    this.saving.set(true);
    const payload = this.form.getRawValue();
    payload.experienceYears = Math.max(0, Number(payload.experienceYears) || 0);

    this.api.updateMyProfile(payload).subscribe({
      next: (res) => {
        this.data.set(res);
        this.error.set(null);
        this.editMode.set(false);
        this.saving.set(false);
        this.snack.open('Perfil guardado', 'OK', { duration: 2200 });
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('No se pudo guardar el perfil', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
