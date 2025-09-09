import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';

export type UserRole = 'admin' | 'psicologo' | 'usuario';

export interface AuthUser {
  id: number;
  name?: string;   // opcional para evitar "undefined"
  email?: string;  // opcional para fallback visual
  role: UserRole;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private _user = signal<AuthUser | null>(this.loadFromStorage());

  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem('lm_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch { return null; }
  }
  private persist(u: AuthUser | null) {
    if (u) localStorage.setItem('lm_user', JSON.stringify(u));
    else localStorage.removeItem('lm_user');
  }

  // ---------- helpers de extracción ----------
  private extractRawRole(input: any): string {
    if (!input) return '';
    if (typeof input === 'string' || typeof input === 'number') return String(input);
    if (Array.isArray(input)) return this.extractRawRole(input[0]);

    // candidatos comunes
    const candidates = [
      'role', 'rol', 'name', 'roleName', 'title', 'value', 'slug', 'code', 'key',
      'tipo', 'tipoRol', 'role_id', 'roleId',
    ];
    for (const c of candidates) {
      if (input[c] != null) return String(input[c]);
    }
    // si viene en user.role
    if (input.user?.role != null) return this.extractRawRole(input.user.role);
    return '';
  }

  private normalizeRole(input: any): UserRole {
    let s = this.extractRawRole(input);

    // si es ID numérico
    if (/^\d+$/.test(s)) {
      if (s === '1') return 'admin';
      if (s === '2') return 'psicologo';
      return 'usuario';
    }

    s = String(s).trim().toLowerCase();
    // quitar tildes
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // compactar espacios
    s = s.replace(/\s+/g, ' ');

    if (['admin', 'administrator', 'administrador'].includes(s)) return 'admin';
    if ([
      'psicologo', 'psicologa', 'psychologist', 'terapeuta', 'terapista',
      'profesional', 'psicologo profesional'
    ].includes(s)) return 'psicologo';
    // por defecto
    return 'usuario';
  }

  private extractId(res: any): number {
    return Number(
      res?.sub ??
      res?.id ??
      res?.user?.id ??
      res?.payload?.sub ??
      res?.data?.id ??
      0
    ) || 0;
  }

  private extractName(res: any): string | undefined {
    const name =
      res?.name ??
      res?.user?.name ??
      res?.fullName ??
      res?.fullname ??
      res?.nombre ??
      (res?.firstName && res?.lastName ? `${res.firstName} ${res.lastName}` : undefined) ??
      res?.user?.fullName ??
      res?.user?.nombre;
    return name ? String(name) : undefined;
  }

  private extractEmail(res: any): string | undefined {
    const email =
      res?.email ??
      res?.user?.email ??
      res?.correo ??
      res?.mail ??
      res?.user?.correo;
    return email ? String(email) : undefined;
  }

  // ---------- API ----------
  login(email: string, password: string) {
    return this.http.post<any>('/api/auth/login', { email, password }).pipe(
      map((res) => {
        // Token puede venir con distintos nombres
        const token: string =
          res?.access_token ?? res?.token ?? res?.accessToken ?? '';

        const user: AuthUser = {
          id: this.extractId(res),
          name: this.extractName(res),
          email: this.extractEmail(res) ?? email, // fallback al email que enviaste
          role: this.normalizeRole(res?.role ?? res?.user?.role ?? res?.roleId ?? res?.user?.roleId),
          token,
        };
        return user;
      }),
      tap((user) => {
        this._user.set(user);
        this.persist(user);
        // console.debug('[Auth] user stored:', user); // descomenta si quieres ver qué quedó
      })
    );
  }

  register(dto: { name: string; email: string; password: string; role?: UserRole }) {
    return this.http.post('/api/users/register', dto);
  }

  logout() { this._user.set(null); this.persist(null); }
  get token(): string { return this._user()?.token ?? ''; }
}
