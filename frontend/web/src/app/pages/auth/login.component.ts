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

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.form.invalid) {
      this.snack.open('Completa los campos correctamente', 'Cerrar', { duration: 2500 });
      return;
    }
    const { email, password } = this.form.value;
    try {
      await this.auth.login(email!, password!); // tu interceptor de error ya muestra toasts si falla
      this.snack.open('¡Bienvenido!', 'Ok', { duration: 1800 });
      this.router.navigateByUrl('/dashboard'); // o /users si prefieres
    } catch {
      // el interceptor de error se encarga; dejamos snack opcional si quieres
    }
  }
}
