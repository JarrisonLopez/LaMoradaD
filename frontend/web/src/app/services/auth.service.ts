import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = '/api';
  user = signal<{ id:number; name:string; email:string; role?: any } | null>(null);
  token = signal<string | null>(localStorage.getItem('token'));

  /** Registro (usa tu endpoint existente) */
  register(body: {name:string; email:string; password:string; roleId?:number}) {
    return this.http.post(`${this.base}/users`, body);
  }

  /** DEMO LOGIN (temporal sin backend):
   * Busca el usuario por email en /users y “valida” la password en cliente.
   * En producción: reemplazar por POST /api/auth/login.
   */
  login(email: string, password: string) {
    return this.http.get<any[]>(`${this.base}/users`).pipe(
      map(users => users.find(u => u.email === email)),
      tap(u => {
        if (!u) throw new Error('Usuario no existe');
        // ⚠️ temporal: si tu backend guarda password plano y lo envía (no debería), podrías comparar aquí
        // if (u.password !== password) throw new Error('Credenciales inválidas');
        // demo: aceptar cualquier password para avanzar:
        const fakeToken = 'demo-token';
        this.token.set(fakeToken);
        localStorage.setItem('token', fakeToken);
        this.user.set(u);
      })
    );
  }

  /** Producción: usar /api/auth/me */
  me() {
    // cuando tengas endpoint real, pide /api/auth/me y setea this.user
    return this.user();
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('token');
  }

  isLoggedIn() { return !!this.token(); }
}
