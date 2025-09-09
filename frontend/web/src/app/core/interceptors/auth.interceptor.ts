import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const u = auth.user();

  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache', // evita 304 molestos en GETs
    Pragma: 'no-cache',
  };

  const token = auth.token;                      // getter
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (u?.role) headers['x-user-role'] = u.role;  // ya normalizado: 'admin'|'psicologo'|'usuario'

  return next(req.clone({ setHeaders: headers }));
};
