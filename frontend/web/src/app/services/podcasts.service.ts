import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PodcastEpisode = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  fileUrl: string;
  mimeType: string | null;
  size: number | null;
  sourceType: 'UPLOAD' | 'URL';
  author?: { id: number; name?: string; email?: string };
  createdAt: string;
  updatedAt: string;
};

@Injectable({ providedIn: 'root' })
export class PodcastsService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  list(): Observable<PodcastEpisode[]> {
    return this.http.get<PodcastEpisode[]>(`${this.base}/podcasts`);
  }

  get(id: number): Observable<PodcastEpisode> {
    return this.http.get<PodcastEpisode>(`${this.base}/podcasts/${id}`);
  }

  /** Subida con progreso */
  uploadEpisode(payload: { title: string; description?: string; category?: string; file: File }): Observable<HttpEvent<PodcastEpisode>> {
    const fd = new FormData();
    fd.append('title', payload.title);
    if (payload.description) fd.append('description', payload.description);
    if (payload.category) fd.append('category', payload.category);
    fd.append('file', payload.file);

    const req = new HttpRequest('POST', `${this.base}/podcasts`, fd, { reportProgress: true });
    return this.http.request<PodcastEpisode>(req);
  }

  /** Crear por URL */
  createByUrl(payload: { title: string; description?: string; category?: string; audioUrl: string }) {
    return this.http.post<PodcastEpisode>(`${this.base}/podcasts/url`, payload);
  }

  remove(id: number) {
    return this.http.delete(`${this.base}/podcasts/${id}`);
  }
}
