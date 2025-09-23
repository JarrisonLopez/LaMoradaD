import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { UsersService } from '../../services/users.service';

/** Tipo que usa la vista (estricto y cómodo) */
type Pro = {
  id: number | string;
  name?: string;
  email: string; // obligatorio en la vista
  role?: { name?: string } | any;
  specialty?: string;
  verified?: boolean;
  photoUrl?: string;
  createdAt?: string | Date;
};

/** Tipo que retorna tu API (lo hacemos permisivo) */
type UserLite = {
  id: number | string;
  name?: string;
  email?: string; // puede venir undefined desde backend
  role?: { name?: string } | any;
  specialty?: string;
  verified?: boolean;
  photoUrl?: string;
  createdAt?: string | Date;
};

@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './professionals.component.html',
  styleUrls: ['./professionals.component.css'],
})
export class ProfessionalsComponent implements OnInit {
  private api = inject(UsersService);
  private router = inject(Router);

  // estado
  loading = signal(true);
  error = signal<string | null>(null);
  list = signal<Pro[]>([]); // ya en formato Pro (normalizado)

  // filtros
  q = '';
  specialty = '';
  sort: 'name-asc' | 'name-desc' | 'recent' = 'name-asc';

  // catálogo de especialidades (derivado)
  specialties = computed(() => {
    const set = new Set<string>();
    for (const p of this.list()) if (p.specialty) set.add(p.specialty);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  // view model filtrado/ordenado
  vm = computed(() => {
    const q = this.q.trim().toLowerCase();
    const spec = this.specialty;

    let arr = this.list().filter((u) => {
      const matchesQ =
        !q ||
        [u.name, u.email, u.role && (u as any).role?.name, u.specialty]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const matchesSpec = !spec || u.specialty === spec;
      return matchesQ && matchesSpec;
    });

    // ordenar
    arr = arr.sort((a, b) => {
      if (this.sort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (this.sort === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (this.sort === 'recent')
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return 0;
    });

    return arr;
  });

  ngOnInit(): void {
    this.api.getProfessionals().subscribe({
      next: (rows: UserLite[]) => {
        const normalized = (rows ?? []).map((r) => this.adaptUser(r));
        this.list.set(normalized); // <-- Pro[] sin errores de tipo
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el listado.');
        this.loading.set(false);
      },
    });
  }

  /** Normaliza el objeto del backend a nuestro tipo de vista Pro */
  private adaptUser(u: UserLite): Pro {
    const email = u.email ?? ''; // asegura string
    const name = (u.name ?? '').trim() || email || 'Sin nombre'; // fallback bonito
    return {
      id: u.id,
      name,
      email,
      role: u.role,
      specialty: u.specialty,
      verified: !!u.verified,
      photoUrl: u.photoUrl ?? '',
      createdAt: u.createdAt,
    };
  }

  applyFilters() {
    /* vm es computed; con asignar q/specialty/sort basta */
  }

  goProfile(u: Pro) {
    this.router.navigate(['/professionals', u.id]);
  }

  initials(text?: string) {
    const t = (text || '').trim();
    if (!t) return '?';
    const parts = t.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join('');
  }
}
