import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './professionals.component.html',
  styleUrls: ['./professionals.component.css'],
})
export class ProfessionalsComponent implements OnInit {
  private api = inject(UsersService);

  loading = signal(true);
  error = signal<string | null>(null);
  list = signal<any[]>([]);

  ngOnInit(): void {
    this.api.getProfessionals().subscribe({
      next: (rows) => { this.list.set(rows || []); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el listado.'); this.loading.set(false); },
    });
  }

  initials(name?: string) {
    return (name || '?').trim().slice(0, 1).toUpperCase();
  }
}
