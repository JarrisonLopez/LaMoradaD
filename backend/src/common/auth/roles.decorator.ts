import { SetMetadata } from '@nestjs/common';
import { normalizeRole, CanonicalRole } from './role-normalizer';

export const ROLES_KEY = 'roles';

/** Acepta enum o string; guarda siempre el valor canónico */
export const Roles = (...roles: any[]) =>
  SetMetadata(ROLES_KEY, roles.map(normalizeRole) as CanonicalRole[]);

/** Alias si usabas @RequireRoles */
export const RequireRoles = Roles;
