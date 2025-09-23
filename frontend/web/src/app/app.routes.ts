import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users.component';
import { RolesComponent } from './pages/roles/roles.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { StoreEbooksComponent } from './pages/store/store-ebooks.component';
import { CheckoutSuccessComponent } from './pages/store/checkout-success.component';
import { CheckoutCancelComponent } from './pages/store/checkout-cancel.component';

export const routes: Routes = [
  // Públicas
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent) },

  { path: 'tienda', component: StoreEbooksComponent },
  { path: 'checkout/success', component: CheckoutSuccessComponent },
  { path: 'checkout/cancel', component: CheckoutCancelComponent },
  { path: 'metrics-lite', loadComponent: () => import('./pages/metrics-lite/metrics-lite.component').then(m => m.MetricsLiteComponent) },
  // === HU-34: Ver profesionales (públicas) ===
  {
    path: 'professionals',
    loadComponent: () => import('./pages/users/professionals.component').then(m => m.ProfessionalsComponent),
  },
  {
    path: 'professionals/:id',
    loadComponent: () => import('./pages/users/professional-profile.component').then(m => m.ProfessionalProfileComponent),
  },

  // === HU: Podcasts (público para ver, psicólogo/admin para subir) ===
  {
    path: 'podcasts',
    loadComponent: () => import('./pages/podcasts/podcasts.component').then(m => m.PodcastsComponent),
  },
  {
    path: 'podcasts/new',
    loadComponent: () => import('./pages/podcasts/podcast-upload.component').then(m => m.PodcastUploadComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['psicologo', 'admin'] },
  },

  // === HU: Blog (público para leer, psicólogo/admin para crear/editar) ===
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog-list.component').then(m => m.BlogListComponent),
  },
  {
    path: 'blog/new',
    loadComponent: () => import('./pages/blog/blog-form.component').then(m => m.BlogFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['psicologo', 'admin'] },
  },
  {
    path: 'blog/:id/edit',
    loadComponent: () => import('./pages/blog/blog-form.component').then(m => m.BlogFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['psicologo', 'admin'] },
  },
  {
    path: 'blog/slug/:slug',
    loadComponent: () => import('./pages/blog/blog-detail.component').then(m => m.BlogDetailComponent),
  },

  // 🔒 protegidas con roles
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'roles',
    component: RolesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'appointments',
    loadComponent: () => import('./pages/appointments/appointments.component').then(m => m.AppointmentsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'availability',
    loadComponent: () => import('./pages/availability/availability.component').then(m => m.AvailabilityComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['psicologo', 'admin'] },
  },
  {
    path: 'ebooks',
    loadComponent: () => import('./pages/ebooks/ebooks.component').then(m => m.EbooksComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['psicologo', 'admin'] },
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
