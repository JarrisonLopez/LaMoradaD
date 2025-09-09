import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Ebook {
  id: number;
  title: string;
  description?: string | null;
  price?: number | null;
  fileUrl?: string | null;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEbookDto {
  title: string;
  description?: string;
  price?: number;
  fileUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class EbooksService {
  constructor(private http: HttpClient) {}

  listMine(): Observable<Ebook[]> {
    return this.http.get<Ebook[]>('/api/ebooks/mine');
  }

  // JSON (sin archivo)
  create(dto: CreateEbookDto): Observable<Ebook> {
    return this.http.post<Ebook>('/api/ebooks', dto);
  }

  // Multipart (con archivo)
  createWithFile(dto: CreateEbookDto, file: File): Observable<Ebook> {
    const fd = new FormData();
    fd.append('title', dto.title);
    if (dto.description) fd.append('description', dto.description);
    if (dto.price != null) fd.append('price', String(dto.price));
    if (dto.fileUrl) fd.append('fileUrl', dto.fileUrl); // opcional si quieres setear ambas cosas
    fd.append('file', file); // << campo 'file' coincide con el interceptor
    return this.http.post<Ebook>('/api/ebooks', fd);
  }
}
