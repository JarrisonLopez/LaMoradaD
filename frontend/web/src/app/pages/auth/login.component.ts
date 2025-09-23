import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService, AuthUser, UserRole } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  hide = true;
  loading = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }

  async onSubmit() {
    if (this.loading || this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.invalid) {
        this.snack.open('Completa los campos correctamente', 'Cerrar', { duration: 2500 });
      }
      return;
    }

    const { email, password } = this.form.value;
    this.loading = true;

    try {
      await firstValueFrom(this.auth.login(email!, password!));

      const user: AuthUser | null = this.auth.user();
      if (!user) throw new Error('No se pudo obtener el usuario');

      const displayName = user.name || user.email || 'Usuario';
      this.snack.open(`¡Bienvenido ${displayName}!`, 'Ok', { duration: 1800 });

      const role = user.role as UserRole;
      this.router.navigateByUrl(role === 'admin' ? '/users' : '/appointments');
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'No se pudo iniciar sesión';
      this.snack.open(message, 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }
}
