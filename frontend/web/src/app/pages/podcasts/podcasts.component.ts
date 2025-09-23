import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PodcastsService, PodcastEpisode } from '../../services/podcasts.service';

@Component({
  standalone: true,
  selector: 'app-podcasts',
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './podcasts.component.html',
  styleUrls: ['./podcasts.component.css'],
})
export class PodcastsComponent implements OnInit {
  private api = inject(PodcastsService);

  loading = signal(true);
  list = signal<PodcastEpisode[]>([]);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (rows) => {
        this.list.set(rows || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el listado');
        this.loading.set(false);
      },
    });
  }
}
