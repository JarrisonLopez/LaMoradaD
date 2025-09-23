import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface BlogListItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  author?: { id: number; name?: string };
}

export interface BlogListResponse {
  items: BlogListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BlogPostDetail extends BlogListItem {
  content: string;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private base = '/api/blog';

  constructor(private http: HttpClient) {}

  list(params: { q?: string; category?: string; page?: number; pageSize?: number }): Observable<BlogListResponse> {
    return this.http.get<BlogListResponse>(this.base, { params: { ...params as any } });
  }

  bySlug(slug: string) {
    return this.http.get<BlogPostDetail>(`${this.base}/slug/${slug}`);
  }

  create(payload: { title: string; content: string; category: string; coverUrl?: string }) {
    return this.http.post<BlogPostDetail>(this.base, payload);
  }

  update(id: number, payload: Partial<{ title: string; content: string; category: string; coverUrl?: string }>) {
    return this.http.put<BlogPostDetail>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete(`${this.base}/${id}`).pipe(map(() => ({ ok: true })));
  }
}
