import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Availability {
  id: number;
  from: string; // ISO
  to: string;   // ISO
  active: boolean;
  professional?: { id: number; name?: string };
}

export interface SlotsResponse {
  professionalId: number;
  date: string; // YYYY-MM-DD
  interval: number;
  slots: Array<{ start: string; end: string; available: boolean }>;
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  constructor(private http: HttpClient) {}

  // Tus disponibilidades
  listMine(): Observable<Availability[]> {
    return this.http.get<Availability[]>('/api/availability/mine');
  }

  // Slots por profesional y fecha
  getSlotsFor(professionalId: number, date: string): Observable<SlotsResponse> {
    const params = new HttpParams().set('date', date);
    return this.http.get<SlotsResponse>(`/api/availability/professional/${professionalId}/slots`, { params });
  }

  // Crear
  create(body: { start: string; end: string }) {
    return this.http.post<Availability>('/api/availability', body);
  }

  // Eliminar (soft delete en backend)
  delete(id: number): Observable<Availability> {
    return this.http.delete<Availability>(`/api/availability/${id}`);
  }

  listByProfessional(professionalId: number) {
    return this.http.get<Availability[]>(`/api/availability/professional/${professionalId}`);
  }
}