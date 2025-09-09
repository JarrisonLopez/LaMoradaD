// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.user();
  if (!user) {
    router.navigateByUrl('/login');
    return false;
  }

  const allowed = route.data?.['roles'] as UserRole[] | undefined;
  if (allowed && !allowed.includes(user.role)) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
