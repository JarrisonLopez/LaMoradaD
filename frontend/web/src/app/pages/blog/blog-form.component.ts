import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService } from '../../services/blog.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-blog-form',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
  <div class="container">
    <mat-card>
      <h2>{{ isEdit() ? 'Editar publicación' : 'Nueva publicación' }}</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Título*</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Categoría*</mat-label>
          <input matInput formControlName="category" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Cover URL (opcional)</mat-label>
          <input matInput formControlName="coverUrl" placeholder="https://.../cover.jpg" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Contenido*</mat-label>
          <textarea matInput formControlName="content" rows="12" placeholder="Escribe tu artículo..."></textarea>
        </mat-form-field>

        <div class="actions">
          <a mat-stroked-button routerLink="/blog">Cancelar</a>
          <button mat-raised-button color="primary" type="submit">{{ isEdit() ? 'Guardar' : 'Publicar' }}</button>
        </div>
      </form>
    </mat-card>
  </div>
  `,
  styles: [`
    .container { max-width: 880px; margin: 1rem auto; padding: 0 1rem; }
    .full { width: 100%; }
    .actions { display:flex; gap:.75rem; justify-content:flex-end; }
  `]
})
export class BlogFormComponent {
  private api = inject(BlogService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  isEdit = signal(false);
  id: number | null = null;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(180)]],
    category: ['', [Validators.required, Validators.maxLength(80)]],
    coverUrl: [''],
    content: ['', [Validators.required]],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id = Number(idParam);
      // Cargar por ID para editar
      // El endpoint público es por slug; para edición usamos list + filtro simple o amplía tu API con /api/blog/:id
      // Aquí asumimos que existe /api/blog/:id (ya incluido en el service) si lo deseas:
      // this.api.byId(this.id).subscribe(p => { ... });
      // Para simplificar el MVP, dejamos al usuario pegar el contenido si viene de la lista.
    }
  }

  submit() {
    if (this.form.invalid) {
      this.snack.open('Completa los campos obligatorios', 'Cerrar', { duration: 2500 });
      return;
    }

    const payload = this.form.getRawValue();

    if (this.isEdit() && this.id != null) {
      const t0 = performance.now();
      this.api.update(this.id, payload).subscribe({
        next: res => {
          const dt = performance.now() - t0;
          this.snack.open(`Guardado ✅ (${Math.round(dt)} ms)`, 'OK', { duration: 2000 });
          this.router.navigateByUrl(`/blog/slug/${res.slug}`);
        },
        error: err => this.snack.open(err?.error?.message || 'No se pudo guardar', 'Cerrar', { duration: 3500 }),
      });
    } else {
      const t0 = performance.now();
      this.api.create(payload).subscribe({
        next: res => {
          const dt = performance.now() - t0;
          this.snack.open(`Publicado ✅ (${Math.round(dt)} ms)`, 'OK', { duration: 2000 });
          this.router.navigateByUrl(`/blog/slug/${res.slug}`);
        },
        error: err => this.snack.open(err?.error?.message || 'No se pudo publicar', 'Cerrar', { duration: 3500 }),
      });
    }
  }
}
