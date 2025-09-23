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

export type ProfessionalProfile = {
  id: string; // id del perfil (tabla professional_profiles)
  user: UserLite & { lastName?: string };
  specialty: string;
  experienceYears: number;
  services?: string;   // CSV o JSON (según backend)
  bio?: string;
  photoUrl?: string;   // /uploads/photos/...
  createdAt?: string;
  updatedAt?: string;
};

export type NotAvailableProfile = {
  error: string;
  message: string;
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
  // NUEVOS MÉTODOS — HU-34
  // ======================

  /**
   * Listado de profesionales (completo) para la vista pública.
   * Backend: GET /api/users/professionals/full
   */
  getProfessionals(): Observable<UserLite[]> {
    return this.http.get<UserLite[]>(`${this.base}/users/professionals/full`);
  }

  /**
   * Perfil de un profesional (público).
   * Backend: GET /api/users/professionals/:id/profile
   * Devuelve ProfessionalProfile o un objeto { error, message } si no existe.
   */
  getProfessionalProfile(id: string | number): Observable<ProfessionalProfile | NotAvailableProfile> {
    return this.http.get<ProfessionalProfile | NotAvailableProfile>(
      `${this.base}/users/professionals/${id}/profile`
    );
  }

  /**
   * Editar / crear mi propio perfil (requiere login como psicólogo).
   * Backend: PATCH /api/users/me/profile
   */
  updateMyProfile(body: {
    specialty?: string;
    experienceYears?: number;
    services?: string;   // CSV o JSON
    bio?: string;
    photoUrl?: string;
  }): Observable<ProfessionalProfile> {
    return this.http.patch<ProfessionalProfile>(`${this.base}/users/me/profile`, body);
  }

  // ======================
  // HELPERS EXISTENTES
  // ======================

  listAll(role?: 'admin' | 'psicologo' | 'usuario'): Observable<UserLite[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<UserLite[]>(`${this.base}/users`, { params });
  }

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

  listPatients(): Observable<UserLite[]> {
    return this.listByRoleClientSide('usuario');
  }

  listProfessionalsLite(): Observable<UserLite[]> {
    return this.listByRoleClientSide('psicologo');
  }

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
