import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PaymentsService } from '../../services/payments.service';

@Component({
  standalone: true,
  selector: 'app-checkout-success',
  template: `
    <h2>¡Pago iniciado correctamente!</h2>

    <p *ngIf="status() === 'PENDING'">Confirmando el pago…</p>
    <p *ngIf="status() === 'PAID'">Tu pago fue confirmado.</p>

    <button
      *ngIf="downloadToken()"
      mat-raised-button
      color="primary"
      (click)="download()"
    >
      Descargar e-book
    </button>

    <p *ngIf="error()" style="color:#c00">{{ error() }}</p>
  `,
  imports: [CommonModule, MatButtonModule],
})
export class CheckoutSuccessComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private pay = inject(PaymentsService);

  status = signal<'PENDING' | 'PAID' | null>(null);
  downloadToken = signal<string | null>(null);
  error = signal<string | null>(null);
  private timer: any;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id') || '';
    if (!sessionId) { this.error.set('Falta session_id'); return; }

    let tries = 0;
    const tick = () => {
      this.pay.status(sessionId).subscribe({
        next: (p: any) => {
          // Esperamos que el backend devuelva { status, downloadToken? }
          this.status.set(p?.status || null);
          this.downloadToken.set(p?.downloadToken || null);

          if (this.status() === 'PAID' && this.downloadToken()) {
            clearInterval(this.timer);
          } else if (++tries >= 40) { // ~40s
            clearInterval(this.timer);
            this.error.set('Aún no se confirmó el pago. Recarga en unos segundos.');
          }
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Error al consultar estado');
          clearInterval(this.timer);
        }
      });
    };

    tick();
    this.timer = setInterval(tick, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  download() {
    const token = this.downloadToken();
    if (!token) return;
    window.location.href = this.pay.downloadUrl(token);
  }
}
