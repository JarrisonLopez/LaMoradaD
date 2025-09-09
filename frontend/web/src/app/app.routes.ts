import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users.component';
import { RolesComponent } from './pages/roles/roles.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent) },

  // 🔒 protegidas con roles (usa roleGuard SIN llamarlo y define roles en data)
  { path: 'users',
    component: UsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  { path: 'roles',
    component: RolesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  { path: 'appointments',
    loadComponent: () => import('./pages/appointments/appointments.component').then(m => m.AppointmentsComponent),
    canActivate: [authGuard] },

  { path: 'availability',
    loadComponent: () => import('./pages/availability/availability.component').then(m => m.AvailabilityComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['psicologo','admin'] }
  },

  { path: 'ebooks',
    loadComponent: () => import('./pages/ebooks/ebooks.component').then(m => m.EbooksComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['psicologo','admin'] }
  },

  { path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard] },

  { path: '**', redirectTo: '' },
];
