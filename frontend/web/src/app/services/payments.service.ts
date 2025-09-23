import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);

  /** Inicia Stripe Checkout en backend */
  checkout(ebookId: number): Observable<{ url: string; purchaseId: number }> {
    return this.http.post<{ url: string; purchaseId: number }>(
      `/api/payments/checkout`,
      { ebookId }
    );
  }

  /** Consulta estado por session_id (usado en /checkout/success) */
  status(sessionId: string): Observable<any> {
    const params = new HttpParams().set('session_id', sessionId);
    return this.http.get(`/api/payments/status`, { params });
  }

  /** Descarga por token (no suele llamarse desde servicio) */
  downloadUrl(token: string) {
    return `/api/payments/download?token=${encodeURIComponent(token)}`;
  }
}
