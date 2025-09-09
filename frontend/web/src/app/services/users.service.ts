// frontend/web/src/app/services/users.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type UserLite = {
  id: number;
  name: string;
  email?: string;
  role?: string | { id?: number; name?: string }; // por compatibilidad
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  /** Lista completa (compatibilidad con tu código actual) */
  list(): Observable<UserLite[]> {
    return this.http.get<UserLite[]>(`${this.base}/users`);
  }

  create(body: { name: string; email: string; password: string; roleId?: number }) {
    return this.http.post<UserLite>(`${this.base}/users`, body);
  }

  // ======================
  // NUEVOS HELPERS (opcional)
  // ======================

  /**
   * Lista con filtro por rol si el backend soporta ?role=
   * (Si tu endpoint aún no implementa ese query param, usa listByRoleClientSide()).
   */
  listAll(role?: 'admin' | 'psicologo' | 'usuario'): Observable<UserLite[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<UserLite[]>(`${this.base}/users`, { params });
  }

  /**
   * Filtra por rol **en el cliente** (por si el backend aún no soporta ?role=).
   * Detecta role como string o como objeto { name }.
   */
  listByRoleClientSide(role: 'admin' | 'psicologo' | 'usuario'): Observable<UserLite[]> {
    const target = role.toLowerCase();
    return this.list().pipe(
      map(users =>
        (users || []).filter(u => {
          const r = typeof u.role === 'string' ? u.role : u.role?.name;
          return (r ?? '').toLowerCase() === target;
        }),
      ),
    );
  }

  /** Conveniencias para el front (psicólogo usa pacientes, admin usa profesionales, etc.) */
  listPatients(): Observable<UserLite[]> {
    return this.listByRoleClientSide('usuario');
  }

  listProfessionals(): Observable<UserLite[]> {
    return this.listByRoleClientSide('psicologo');
  }

  // (Opcional) utilidades
  get(id: number): Observable<UserLite> {
    return this.http.get<UserLite>(`${this.base}/users/${id}`);
  }

  update(id: number, body: Partial<{ name: string; email: string; password: string; roleId: number }>) {
    return this.http.patch<UserLite>(`${this.base}/users/${id}`, body);
  }

  remove(id: number) {
    return this.http.delete(`${this.base}/users/${id}`);
  }
}
