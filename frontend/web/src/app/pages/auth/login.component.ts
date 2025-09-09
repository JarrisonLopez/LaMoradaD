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

  async onSubmit() {
    if (this.loading) return;
    if (this.form.invalid) {
      this.snack.open('Completa los campos correctamente', 'Cerrar', { duration: 2500 });
      return;
    }

    const { email, password } = this.form.value;
    this.loading = true;

    try {
      // Login: normaliza y persiste el usuario dentro de AuthService
      await firstValueFrom(this.auth.login(email!, password!));

      const user: AuthUser | null = this.auth.user();
      if (!user) throw new Error('No se pudo obtener el usuario');

      // Mostrar nombre si existe; si no, fallback a email o "Usuario"
      const displayName = user.name || user.email || 'Usuario';
      this.snack.open(`¡Bienvenido ${displayName}!`, 'Ok', { duration: 1800 });

      // Redirección por rol (ya normalizado: 'admin' | 'psicologo' | 'usuario')
      const role = user.role as UserRole;
      if (role === 'admin') {
        this.router.navigateByUrl('/users');
      } else if (role === 'psicologo') {
        this.router.navigateByUrl('/appointments');
      } else {
        this.router.navigateByUrl('/appointments');
      }
    } catch (err: any) {
      const message = err?.error?.message || err?.message || 'No se pudo iniciar sesión';
      this.snack.open(message, 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }
}
