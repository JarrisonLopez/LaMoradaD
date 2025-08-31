import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
  <div class="auth-card">
    <h2>Iniciar sesión</h2>
    <form [formGroup]="fg" (ngSubmit)="onSubmit()">
      <div class="field">
        <label>Email</label>
        <input type="email" formControlName="email" required />
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input type="password" formControlName="password" required />
      </div>
      <button [disabled]="fg.invalid">Entrar</button>
    </form>
    <p style="margin-top:8px">¿No tienes cuenta? <a routerLink="/register">Regístrate</a></p>
  </div>
  `,
  styles:[`
    .auth-card{max-width:420px;margin:40px auto;padding:24px;border-radius:12px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.08)}
    .field{display:flex;flex-direction:column;margin-bottom:12px} label{font-weight:600;margin-bottom:6px}
    input{padding:10px;border:1px solid #ccc;border-radius:8px}
    button{padding:10px 16px;border:0;border-radius:8px; background:#5b3cc4; color:#fff; font-weight:600; cursor:pointer}
    button[disabled]{opacity:.6;cursor:not-allowed}
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  fg = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(){
    if(this.fg.invalid) return;
    const { email, password } = this.fg.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (e) => alert(e.message || 'Error de autenticación'),
    });
  }
}
