import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users.component';
import { RolesComponent } from './pages/roles/roles.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Público
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register.component').then((m) => m.RegisterComponent),
  },

  // Protegido
  { path: 'users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'roles', component: RolesComponent, canActivate: [authGuard] },
  {
    path: 'appointments',
    loadComponent: () =>
      import('./pages/appointments/appointments.component').then((m) => m.AppointmentsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'availability',
    loadComponent: () =>
      import('./pages/availability/availability.component').then((m) => m.AvailabilityComponent),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
