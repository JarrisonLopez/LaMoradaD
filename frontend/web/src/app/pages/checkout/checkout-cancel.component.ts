import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-checkout-cancel',
  imports: [CommonModule, RouterLink, MatButtonModule],
  templateUrl: './checkout-cancel.component.html'
})
export class CheckoutCancelComponent {}
