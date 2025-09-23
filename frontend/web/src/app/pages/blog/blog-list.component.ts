// src/app/pages/blog/blog-list.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService, BlogListItem } from '../../services/blog.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-blog-list',
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
  template: `
  <div class="container">
    <h2>Blog</h2>

    <form [formGroup]="form" class="filters" (ngSubmit)="load()">
      <mat-form-field appearance="outline">
        <mat-label>Buscar</mat-label>
        <input matInput formControlName="q" placeholder="Título..." />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Categoría</mat-label>
        <input matInput formControlName="category" placeholder="Ej: terapia" />
      </mat-form-field>
      <button mat-stroked-button type="submit">Filtrar</button>
      <button mat-button type="button" (click)="clear()">Limpiar</button>
      <a mat-raised-button color="primary" routerLink="/blog/new" class="right">Nuevo</a>
    </form>

    <div class="empty" *ngIf="items().length === 0">No hay publicaciones aún.</div>

    <div class="grid" *ngIf="items().length > 0">
      <mat-card *ngFor="let p of items()">
        <img *ngIf="p.coverUrl" [src]="p.coverUrl" alt="cover" />
        <mat-card-title>{{ p.title }}</mat-card-title>
        <mat-card-subtitle>{{ p.category }} · {{ p.createdAt | date:'mediumDate' }}</mat-card-subtitle>
        <div class="actions">
          <a mat-button color="primary" [routerLink]="['/blog/slug', p.slug]">Leer</a>
          <a mat-button color="accent" [routerLink]="['/blog', p.id, 'edit']">Editar</a>
        </div>
      </mat-card>
    </div>
  </div>
  `,
  styles: [`
  .container { max-width: 960px; margin: 1rem auto; padding: 0 1rem; }
  .filters { display: grid; grid-template-columns: 1fr 1fr auto auto auto; gap: .75rem; align-items: center; }
  .right { margin-left: auto; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 1rem; margin-top: 1rem; }
  mat-card img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; }
  .actions { display: flex; gap: .5rem; margin-top: .5rem; }
  `]
})
export class BlogListComponent {
  private api = inject(BlogService);
  private fb = inject(FormBuilder);
  items = signal<BlogListItem[]>([]);

  form = this.fb.group({
    q: [''],
    category: [''],
  });

  // 👇 AQUÍ: entrar sin filtros
  ngOnInit() {
    this.form.reset();
    this.load();
  }

  // 👇 AQUÍ: solo enviar filtros con texto real
  load() {
    let { q, category } = this.form.value as { q?: string; category?: string };
    q = q?.trim(); category = category?.trim();

    this.api.list({
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
    }).subscribe(res => {
      console.log('Blog list response:', res);
      this.items.set(res.items || []);
    });
  }

  clear() {
    this.form.reset();
    this.load();
  }
}
