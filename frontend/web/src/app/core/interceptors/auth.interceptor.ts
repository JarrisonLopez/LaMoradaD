import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const u = auth.user();

  // Siempre: evitar cache agresivo del navegador
  const baseHeaders: Record<string, string> = {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  };

  // Rutas públicas donde NO queremos mandar Authorization ni x-user-role
  // (checkout/status/download/webhook deben ser accesibles a visitantes)
  const url = req.url || '';
  const isPaymentsPublic =
    url.startsWith('/api/payments/checkout') ||
    url.startsWith('/api/payments/status') ||
    url.startsWith('/api/payments/download') ||
    url.startsWith('/api/payments/webhook') ||
    // por si el HttpClient usa URL absoluta:
    url.includes('/api/payments/checkout') ||
    url.includes('/api/payments/status') ||
    url.includes('/api/payments/download') ||
    url.includes('/api/payments/webhook');

  // Si la ruta es pública, no añadimos cabeceras de auth/rol
  if (isPaymentsPublic) {
    return next(req.clone({ setHeaders: baseHeaders }));
  }

  // Para el resto de rutas: adjuntar token si existe y rol normalizado
  const headers: Record<string, string> = { ...baseHeaders };
  const token = auth.token; // getter
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (u?.role) headers['x-user-role'] = u.role; // 'admin'|'psicologo'|'usuario'

  return next(req.clone({ setHeaders: headers }));
};
