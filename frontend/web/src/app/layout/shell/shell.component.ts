import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule, MatButtonModule,
    LoaderComponent],
  template: `
  <mat-sidenav-container class="shell">
    <mat-sidenav #s mode="side" [opened]="opened()">
      <div class="brand">LaMorada</div>
      <mat-nav-list>
        <a mat-list-item routerLink="/dashboard" (click)="closeOnMobile(s)">Dashboard</a>
        <a mat-list-item routerLink="/users" (click)="closeOnMobile(s)">Usuarios</a>
        <a mat-list-item routerLink="/roles" (click)="closeOnMobile(s)">Roles</a>
        <a mat-list-item routerLink="/appointments" (click)="closeOnMobile(s)">Citas</a>
        <a mat-list-item routerLink="/availability" (click)="closeOnMobile(s)">Disponibilidad</a>
      </mat-nav-list>
    </mat-sidenav>

    <mat-sidenav-content>
      <!-- 👇 AQUÍ va el loader -->
      <app-loader />

      <mat-toolbar color="primary">
        <button mat-icon-button (click)="toggle(s)"><mat-icon>menu</mat-icon></button>
        <span style="margin-left:.5rem">LaMorada</span>
        <span class="spacer"></span>
        <a mat-button href="/api/docs" target="_blank">API Docs</a>
      </mat-toolbar>

      <main class="content"><router-outlet /></main>
    </mat-sidenav-content>
  </mat-sidenav-container>
  `,
  styles:[`
    .shell { height:100vh; }
    .brand { font-weight:700; padding:16px; }
    .spacer { flex:1 1 auto; }
    .content { padding:16px; max-width:1200px; margin:0 auto; }
    @media (max-width: 900px) { :host ::ng-deep mat-sidenav { width: 240px; } }
  `]
})
export class ShellComponent {
  opened = signal(true);
  toggle(s:any){ this.opened.set(!this.opened()); s.toggle(); }
  closeOnMobile(s:any){ if (window.innerWidth < 900) s.close(); }
}
