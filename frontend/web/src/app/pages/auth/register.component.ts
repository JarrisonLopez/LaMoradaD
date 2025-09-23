import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  hide = true;
  loading = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get name() {
    return this.form.get('name');
  }
  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }

  async onSubmit() {
    if (this.loading) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Revisa los datos del formulario', 'Cerrar', { duration: 2500 });
      return;
    }

    const { name, email, password } = this.form.value!;
    this.loading = true;

    try {
      // Tu firma actual: register({ name, email, password })
      await firstValueFrom(this.auth.register({ name: name!, email: email!, password: password! }));
      this.snack.open('Cuenta creada, ahora inicia sesión', 'Ok', { duration: 2000 });
      this.router.navigateByUrl('/login');
    } catch (e: any) {
      this.snack.open(e?.message || 'No se pudo registrar', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }
}
