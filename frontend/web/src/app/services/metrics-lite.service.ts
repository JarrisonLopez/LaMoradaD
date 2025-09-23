// src/app/services/metrics-lite.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MetricsLite { visits: number; reservations: number; sales: number; }

@Injectable({ providedIn: 'root' })
export class MetricsLiteService {
  private base = '/api/metrics-lite';
  constructor(private http: HttpClient) {}
  get(professionalId: number): Observable<MetricsLite> {
    return this.http.get<MetricsLite>(`${this.base}/${professionalId}`);
  }
}
