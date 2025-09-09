import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type AppointmentRow = {
  id: number;
  status: string;
  startsAt: string;
  endsAt: string;
  user: { id: number; name?: string } | null;
  professional: { id: number; name?: string } | null;
};

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private http: HttpClient) {}

  // Para psicólogo: usa ?date=YYYY-MM-DD
  listForDate(date: string) {
    return this.http.get<AppointmentRow[]>(`/api/appointments?date=${date}`);
  }

  create(body: { userId: number; professionalId?: number; startsAt: string; endsAt: string }) {
    return this.http.post<AppointmentRow>('/api/appointments', body);
  }
}
