// src/app/pages/metrics-lite/metrics-lite.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsLiteService } from '../../core/services/metrics-lite.service';

@Component({
  selector: 'app-metrics-lite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-lite.component.html',
})
export class MetricsLiteComponent implements OnInit {
  loading = signal(false);
  error = signal('');
  data = signal<{ visits:number; reservations:number; sales:number } | null>(null);

  // Cambia esto por el id real del profesional (de tu auth/estado)
  professionalId = 123;

  constructor(private api: MetricsLiteService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.api.get(this.professionalId).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Error'); this.loading.set(false); },
    });
  }
}
