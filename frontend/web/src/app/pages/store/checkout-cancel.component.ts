import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-checkout-cancel',
  template: `
    <h2>Pago cancelado</h2>
    <p>Tu compra fue cancelada. Puedes volver a intentarlo cuando quieras.</p>
  `,
})
export class CheckoutCancelComponent {}
