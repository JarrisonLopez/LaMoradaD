import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { BlogService, BlogListItem } from '../../services/blog.service';

@Component({
  standalone: true,
  selector: 'app-blog-list',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.css'],
  encapsulation: ViewEncapsulation.None, // Para que las variables/overrides afecten a MDC
})
export class BlogListComponent {
  private api = inject(BlogService);
  private fb = inject(FormBuilder);

  items = signal<BlogListItem[]>([]);

  form = this.fb.group({
    q: [''],
    category: [''],
  });

  ngOnInit(): void {
    this.form.reset();
    this.load();
  }

  load(): void {
    let { q, category } = this.form.value as { q?: string; category?: string };
    q = q?.trim();
    category = category?.trim();

    this.api
      .list({
        ...(q ? { q } : {}),
        ...(category ? { category } : {}),
      })
      .subscribe({
        next: (res) => this.items.set(res.items || []),
        error: () => this.items.set([]),
      });
  }

  clear(): void {
    this.form.reset();
    this.load();
  }

  /** trackBy para mejor rendimiento */
  trackById = (_: number, item: BlogListItem) => item.id ?? item.slug ?? _;
}
