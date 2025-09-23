import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';

@Component({
  standalone: true,
  selector: 'app-blog-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <!-- HERO -->
      <div class="page-hero">
        <div class="page-badge">
          <span class="badge-icon">📝</span>
        </div>
        <div class="page-hero__text">
          <h1>Nueva publicación</h1>
          <p class="subtitle">Comparte novedades y artículos con tu comunidad.</p>
        </div>
      </div>

      <!-- CARD -->
      <form class="form-card" [formGroup]="fg" (ngSubmit)="submit()">
        <!-- Título -->
        <label class="fld with-icon" data-icon="✏️">
          <input type="text" formControlName="title" placeholder="Título***" autocomplete="off" />
        </label>

        <!-- Categoría -->
        <label class="fld with-icon" data-icon="🏷️">
          <input
            type="text"
            formControlName="category"
            placeholder="Categoría***"
            autocomplete="off"
          />
        </label>

        <!-- Cover URL -->
        <label class="fld with-icon" data-icon="🖼️">
          <input
            type="url"
            formControlName="coverUrl"
            placeholder="Cover URL (opcional)"
            autocomplete="off"
          />
        </label>

        <!-- Contenido -->
        <label class="fld">
          <textarea rows="10" formControlName="content" placeholder="Contenido***"></textarea>
        </label>

        <!-- ACCIONES -->
        <div class="form-actions">
          <button type="button" class="btn btn-outline" (click)="cancel()">Cancelar</button>
          <button class="btn btn-primary" type="submit" [disabled]="fg.invalid || loading">
            {{ loading ? 'Publicando…' : 'Publicar' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      :host {
        --lm-surface: #ffffff;
        --lm-bg: #fbf9ff; /* fondo muy suave */
        --lm-border: #ece8ff; /* lila clarito */
        --lm-text: #1e1b2f;
        --lm-text-soft: #6f6a86;

        --lm-primary: #6b5bfd; /* morado LaMorada */
        --lm-primary-600: #5a4fcf;
        --lm-primary-300: #a699ff;

        --lm-radius-xl: 18px;
        --lm-radius-md: 12px;

        --lm-shadow-1: 0 10px 30px rgba(80, 56, 200, 0.12);
        --lm-shadow-2: 0 18px 50px rgba(80, 56, 200, 0.16);
        display: block;
        background: transparent;
      }

      .page {
        max-width: 980px;
        margin: 0 auto;
        padding: 8px 16px 32px;
      }

      /* HERO */
      .page-hero {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 10px 0 18px;
      }
      .page-badge {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        box-shadow: var(--lm-shadow-2);
        background: linear-gradient(135deg, #5a4fcf 0%, #6a56e8 45%, #9b86ff 100%);
      }
      .badge-icon {
        color: #f6f4ff;
        font-size: 20px;
      }
      .page-hero__text h1 {
        margin: 0;
        font-size: 1.9rem;
        line-height: 1.12;
        color: var(--lm-text);
        letter-spacing: -0.01em;
      }
      .subtitle {
        margin: 4px 0 0;
        color: var(--lm-text-soft);
        font-size: 0.975rem;
      }

      /* CARD */
      .form-card {
        background: var(--lm-surface);
        border: 1px solid var(--lm-border);
        border-radius: var(--lm-radius-xl);
        padding: 16px;
        box-shadow: var(--lm-shadow-1);
        display: grid;
        gap: 12px;
        max-width: 720px;
      }

      .fld {
        display: block;
        width: 100%;
        position: relative;
      }

      .fld input,
      .fld textarea {
        /* 👇 evita que el padding sume ancho y se desborde */
        box-sizing: border-box;

        width: 100%;
        border: 1px solid var(--lm-border);
        background: #fff;
        border-radius: 12px;
        font-size: 0.98rem;
        color: var(--lm-text);
        padding: 14px 14px;
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
        outline: none;
      }
      .fld textarea {
        resize: vertical;
        min-height: 160px;
      }

      /* icono a la izquierda via data-attr */
      .with-icon input {
        padding-left: 42px;
      }
      .with-icon::before {
        content: attr(data-icon);
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
        color: var(--lm-text-soft);
        pointer-events: none;
      }

      /* Foco/hover */
      .fld input:hover,
      .fld textarea:hover {
        border-color: var(--lm-primary-300);
      }
      .fld input:focus,
      .fld textarea:focus {
        border-color: var(--lm-primary);
        box-shadow: 0 0 0 3px rgba(107, 91, 253, 0.12);
      }

      /* ACCIONES */
      .form-actions {
        margin-top: 6px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .btn {
        border-radius: 999px;
        padding: 10px 18px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        border: 1px solid transparent;
        transition: transform 0.06s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      .btn:active {
        transform: translateY(1px);
      }

      .btn-outline {
        background: #fff;
        color: var(--lm-text);
        border-color: var(--lm-border);
      }
      .btn-outline:hover {
        border-color: var(--lm-primary-300);
        box-shadow: 0 6px 18px rgba(80, 56, 200, 0.1);
      }

      .btn-primary {
        background: var(--lm-primary);
        color: #fff;
        box-shadow: 0 8px 22px rgba(80, 56, 200, 0.22);
      }
      .btn-primary:hover {
        background: var(--lm-primary-600);
        box-shadow: 0 12px 28px rgba(80, 56, 200, 0.28);
      }
      .btn-primary[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }

      @media (max-width: 720px) {
        .form-card {
          border-radius: 16px;
        }
      }
    `,
  ],
})
export class BlogFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(BlogService);
  private router = inject(Router);

  loading = false;

  fg = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(180)]],
    category: ['', [Validators.required, Validators.maxLength(80)]],
    coverUrl: [''],
    content: ['', [Validators.required, Validators.minLength(10)]],
  });

  submit() {
    if (this.fg.invalid || this.loading) return;
    this.loading = true;

    const { title, category, coverUrl, content } = this.fg.value;
    this.api
      .create({
        title: (title || '').trim(),
        category: (category || '').trim(),
        coverUrl: (coverUrl || '').trim() || undefined,
        content: (content || '').trim(),
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/blog'),
        error: () => {
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  cancel() {
    this.router.navigateByUrl('/blog');
  }
}
