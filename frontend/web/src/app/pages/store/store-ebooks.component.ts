import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EbooksService, Ebook } from '../../services/ebooks.service';
import { PaymentsService } from '../../services/payments.service';

@Component({
  standalone: true,
  selector: 'app-store-ebooks',
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './store-ebooks.component.html',
  styleUrls: ['./store-ebooks.component.css']
})
export class StoreEbooksComponent implements OnInit {
  private api = inject(EbooksService);
  private pay = inject(PaymentsService);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  rows = signal<Ebook[]>([]);

  visibleRows = computed(() =>
    (this.rows() ?? []).filter(e => e.price != null && e.price > 0)
  );

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (data: Ebook[]) => this.rows.set(data ?? []),   // ✅ tipado
      error: (err: any) => {                                // ✅ tipado
        console.error('[store] list error', err);
        this.snack.open('No se pudo cargar la tienda', 'Cerrar', { duration: 3000 });
      }
    });
  }

  buy(e: Ebook) {
    if (!e?.id || this.loading()) return;
    this.loading.set(true);
    this.pay.checkout(e.id).subscribe({
      next: ({ url }) => window.location.href = url,
      error: (err: any) => {
        console.error('[store] checkout error', err);
        const msg = err?.error?.message || 'No se pudo iniciar el pago';
        this.snack.open(msg, 'Cerrar', { duration: 3500 });
        this.loading.set(false);
      }
    });
  }
}
