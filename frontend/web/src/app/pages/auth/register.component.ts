import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RolesService } from '../../services/roles.service';
import { AuthService } from '../../services/auth.service';
import { NgFor } from '@angular/common';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgFor],
  template: `
  <div class="auth-card">
    <h2>Registro</h2>
    <form [formGroup]="fg" (ngSubmit)="onSubmit()">
      <div class="field"><label>Nombre</label><input formControlName="name" required /></div>
      <div class="field"><label>Email</label><input type="email" formControlName="email" required /></div>
      <div class="field"><label>Contraseña</label><input type="password" formControlName="password" required /></div>
      <div class="field">
        <label>Rol (opcional)</label>
        <select formControlName="roleId">
          <option [ngValue]="null">Sin rol</option>
          <option *ngFor="let r of roles" [ngValue]="r.id">{{r.name}}</option>
        </select>
      </div>
      <button [disabled]="fg.invalid">Crear cuenta</button>
    </form>
    <p style="margin-top:8px">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
  </div>
  `,
  styles:[`
    .auth-card{max-width:480px;margin:40px auto;padding:24px;border-radius:12px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.08)}
    .field{display:flex;flex-direction:column;margin-bottom:12px} label{font-weight:600;margin-bottom:6px}
    input, select{padding:10px;border:1px solid #ccc;border-radius:8px}
    button{padding:10px 16px;border:0;border-radius:8px; background:#5b3cc4; color:#fff; font-weight:600; cursor:pointer}
    button[disabled]{opacity:.6;cursor:not-allowed}
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private rolesSvc = inject(RolesService);
  private auth = inject(AuthService);

  roles:any[] = [];

  fg = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roleId: [null as number | null]
  });

  ngOnInit(){ this.rolesSvc.list().subscribe(r => this.roles = r as any[]); }

  onSubmit(){
    if (this.fg.invalid) return;
    this.auth.register(this.fg.getRawValue() as any).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (e) => alert(e.error?.message || 'Error al registrarse'),
    });
  }
}
