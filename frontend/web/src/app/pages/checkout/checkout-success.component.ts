import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentsService } from '../../services/payments.service';

@Component({
  standalone: true,
  selector: 'app-checkout-success',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.css']
})
export class CheckoutSuccessComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private pay = inject(PaymentsService);
  private snack = inject(MatSnackBar);

  loading = signal(true);
  sessionId = '';
  downloadUrl: string | null = null;
  tries = 0;
  maxTries = 30; // ~60s si usas 2s entre intentos
  timer: any;

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') ?? '';
    if (!this.sessionId) {
      this.loading.set(false);
      this.snack.open('Falta session_id en la URL', 'Cerrar', { duration: 4000 });
      return;
    }
    this.poll();
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  private poll() {
    this.loading.set(true);
    this.pay.status(this.sessionId).subscribe({
      next: (purchase: any) => {
        // purchase.status lo retorna tu backend (PENDING/PAID)
        if (purchase?.status === 'PAID' && purchase?.downloadToken) {
          this.downloadUrl = this.pay.downloadUrl(purchase.downloadToken);
          this.loading.set(false);
          this.snack.open('¡Pago confirmado! Ya puedes descargar tu e-book.', 'Ok', { duration: 3000 });
        } else {
          this.tries++;
          if (this.tries >= this.maxTries) {
            this.loading.set(false);
            this.snack.open('Aún no vemos el pago. Intenta actualizar en unos segundos.', 'Cerrar', { duration: 5000 });
          } else {
            this.timer = setTimeout(() => this.poll(), 2000);
          }
        }
      },
      error: (err) => {
        console.error('[checkout-success] status error', err);
        this.loading.set(false);
        this.snack.open('No se pudo verificar el pago', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
