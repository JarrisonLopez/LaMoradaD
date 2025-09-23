import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { PodcastsService } from '../../services/podcasts.service';
import { HttpEventType } from '@angular/common/http';

const MAX_MB = 50;
const ALLOWED = ['audio/mpeg', 'audio/wav', 'audio/x-wav'];

@Component({
  standalone: true,
  selector: 'app-podcast-upload',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatProgressBarModule, MatSnackBarModule, MatButtonToggleModule,
  ],
  templateUrl: './podcast-upload.component.html',
  styleUrls: ['./podcast-upload.component.css'],
})
export class PodcastUploadComponent {
  private fb = inject(FormBuilder);
  private api = inject(PodcastsService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  mode = signal<'file' | 'url'>('file'); // alterna modo
  uploading = signal(false);
  progress = signal(0);
  file: File | null = null;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(180)]],
    description: [''],
    category: [''],
    audioUrl: [''], // solo para modo URL
  });

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      this.snack.open('Formato no permitido. Solo MP3 o WAV.', 'Cerrar', { duration: 3000 });
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      this.snack.open('El archivo supera 50MB.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.file = f;
  }

  submit() {
    if (!this.form.controls.title.value) {
      this.snack.open('El título es obligatorio.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.mode() === 'file') {
      if (!this.file) {
        this.snack.open('Selecciona un MP3 o WAV válido.', 'Cerrar', { duration: 3000 });
        return;
      }
      this.uploading.set(true);
      this.progress.set(10);

      this.api.uploadEpisode({
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        category: this.form.controls.category.value,
        file: this.file,
      }).subscribe({
        next: (e) => {
          if (e.type === HttpEventType.UploadProgress && e.total) {
            const p = Math.round(100 * (e.loaded / e.total));
            this.progress.set(p);
          } else if (e.type === HttpEventType.Response) {
            this.snack.open('Episodio publicado ✅', 'OK', { duration: 2500 });
            this.router.navigateByUrl('/podcasts');
          }
        },
        error: (err) => {
          this.uploading.set(false);
          const msg = err?.error?.message || 'No se pudo subir el episodio';
          this.snack.open(msg, 'Cerrar', { duration: 3500 });
        },
        complete: () => this.uploading.set(false),
      });

    } else {
      const url = (this.form.controls.audioUrl.value || '').trim();

      // ✅ Validación relajada: cualquier URL http(s)
      try {
        const parsed = new URL(url);
        if (!/^https?:$/.test(parsed.protocol)) {
          this.snack.open('La URL debe empezar con http:// o https://', 'Cerrar', { duration: 3000 });
          return;
        }
      } catch {
        this.snack.open('Ingresa una URL válida (http o https)', 'Cerrar', { duration: 3000 });
        return;
      }

      this.uploading.set(true);
      this.api.createByUrl({
        title: this.form.controls.title.value,
        description: this.form.controls.description.value,
        category: this.form.controls.category.value,
        audioUrl: url,
      }).subscribe({
        next: () => {
          this.snack.open('Episodio publicado desde URL ✅', 'OK', { duration: 2500 });
          this.router.navigateByUrl('/podcasts');
        },
        error: (err) => {
          this.uploading.set(false);
          const msg = err?.error?.message || 'No se pudo crear el episodio por URL';
          this.snack.open(msg, 'Cerrar', { duration: 3500 });
        },
        complete: () => this.uploading.set(false),
      });
    }
  }
}
