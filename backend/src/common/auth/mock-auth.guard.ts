import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const id = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];

    if (!id || !role) {
      req.user = { id: 1, role: { name: 'usuario' } };
    } else {
      req.user = { id: Number(id), role: { name: String(role) } };
    }
    return true;
  }
}
