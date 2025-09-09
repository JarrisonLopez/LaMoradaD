import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { normalizeRole } from '../common/auth/role-normalizer'; // <-- usa el normalizador único


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 👇 Aseguramos un string (con fallback) para evitar TS2345
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev_secret',
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      name: payload.name,
      role: normalizeRole(payload.role),
    };
  }
}
