import { Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class UiService {
  loading = signal(false);
  constructor(private snack: MatSnackBar) {}
  show(msg: string, dur = 2500) { this.snack.open(msg, 'OK', { duration: dur }); }
}
