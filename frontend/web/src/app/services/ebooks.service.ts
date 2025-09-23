// LaMorada/frontend/web/src/app/services/ebooks.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Ebook {
  id: number;
  title: string;
  description?: string;
  price?: number;   // COP (pesos colombianos)
  fileUrl?: string; // URL pública o ruta relativa servida por /uploads
  author?: { id: number; name?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEbookDto {
  title: string;
  description?: string;
  price?: number;
  fileUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class EbooksService {
  private http = inject(HttpClient);
  private base = '/api/ebooks';

  /** Público: lista todos los e-books (para la tienda) */
  list(): Observable<Ebook[]> {
    return this.http.get<Ebook[]>(this.base);
  }

  /** Autores: lista de mis e-books (requiere JWT en el interceptor) */
  listMine(): Observable<Ebook[]> {
    return this.http.get<Ebook[]>(`${this.base}/mine`);
  }

  /** E-books por autor */
  byAuthor(authorId: number): Observable<Ebook[]> {
    return this.http.get<Ebook[]>(`${this.base}/author/${authorId}`);
  }

  /** Detalle por id */
  get(id: number): Observable<Ebook> {
    return this.http.get<Ebook>(`${this.base}/${id}`);
  }

  /** Crear e-book (JSON) */
  create(dto: CreateEbookDto): Observable<Ebook> {
    return this.http.post<Ebook>(this.base, dto);
  }

  /** Crear e-book subiendo archivo */
  createWithFile(dto: CreateEbookDto, file: File): Observable<Ebook> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', String(dto.title));
    if (dto.description != null) fd.append('description', String(dto.description));
    if (dto.price != null) fd.append('price', String(dto.price));
    if (dto.fileUrl) fd.append('fileUrl', String(dto.fileUrl));
    return this.http.post<Ebook>(this.base, fd);
  }

  /** Editar */
  update(id: number, patch: Partial<CreateEbookDto>): Observable<Ebook> {
    return this.http.patch<Ebook>(`${this.base}/${id}`, patch);
  }

  /** Borrar */
  remove(id: number): Observable<{ ok: true }> {
    return this.http.delete(`${this.base}/${id}`).pipe(map(() => ({ ok: true })));
  }
}
