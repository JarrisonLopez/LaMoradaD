import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { normalizeRole, CanonicalRole } from './role-normalizer';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly log = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = (this.reflector.getAllAndOverride<any[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) ?? []).map(normalizeRole) as CanonicalRole[];

    if (!required.length) return true;

    const req = ctx.switchToHttp().getRequest();

    // Prioridad: rol del JWT validado por JwtStrategy
    const userRole = normalizeRole(
      req?.user?.role ??
      req?.user?.role?.name ??
      req?.user?.roleId ??
      req?.headers?.['x-user-role'] // fallback legacy
    );

    const ok = required.includes(userRole);
    if (!ok) {
      this.log.warn(`Rol insuficiente: requerido=${required.join(',')} | usuario=${userRole}`);
    }
    return ok;
  }
}
