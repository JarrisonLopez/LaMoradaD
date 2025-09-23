import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService, BlogPostDetail } from '../../services/blog.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterModule, MatCardModule],
  template: `
  <div class="container" *ngIf="post() as p">
    <mat-card>
      <img *ngIf="p.coverUrl" [src]="p.coverUrl" alt="cover"/>
      <h1>{{ p.title }}</h1>
      <div class="meta">{{ p.category }} · {{ p.createdAt | date:'medium' }}</div>
      <div class="content" [innerHTML]="render(p.content)"></div>
    </mat-card>
  </div>
  `,
  styles: [`
    .container { max-width: 880px; margin: 1rem auto; padding: 0 1rem; }
    mat-card img { width: 100%; max-height: 320px; object-fit: cover; border-radius: 8px; margin-bottom: .5rem; }
    .meta { color: #666; margin-bottom: 1rem; }
    .content { white-space: pre-wrap; line-height: 1.6; }
  `]
})
export class BlogDetailComponent {
  private api = inject(BlogService);
  private route = inject(ActivatedRoute);
  post = signal<BlogPostDetail | null>(null);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.bySlug(slug).subscribe(p => this.post.set(p));
  }

  // Simple: si más adelante quieres MD, integra marked o similar
  render(s: string) { return s; }
}
