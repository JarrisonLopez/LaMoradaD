import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type UserRole = 'admin' | 'psicologo' | 'usuario';

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
  token: string;
}

interface LoginResponse {
  access_token: string;
  sub: number;
  name: string;
  role: UserRole;
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
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
    } catch {
      return null;
    }
  }

  private persist(user: AuthUser | null) {
    if (user) localStorage.setItem('lm_user', JSON.stringify(user));
    else localStorage.removeItem('lm_user');
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      map((res) => ({
        id: res.sub,
        name: res.name,
        role: res.role,
        token: res.access_token,
      })),
      tap((user) => {
        this._user.set(user);
        this.persist(user);
      })
    );
  }

  register(dto: RegisterDto) {
    return this.http.post('/api/users/register', dto);
  }

  logout() {
    this._user.set(null);
    this.persist(null);
  }

  get token(): string {
    return this._user()?.token ?? '';
  }
}
