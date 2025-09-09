import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';

export type UserRole = 'admin' | 'psicologo' | 'usuario';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  /** Quita tildes y normaliza */
  private stripAccents(s: string) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /** Normaliza cualquier variante (objeto, id numérico o string) a 'admin' | 'psicologo' | 'usuario' */
  private normalizeRole(input: any): UserRole {
    let raw: any = input;

    // si viene objeto (p.ej. relation Role)
    if (raw && typeof raw === 'object') {
      raw = raw.name ?? raw.role ?? raw.roleId ?? raw.code ?? raw.slug ?? '';
    }

    // id numérico común
    const asStr = String(raw ?? '').trim();
    if (/^\d+$/.test(asStr)) {
      if (asStr === '1') return 'admin';
      if (asStr === '2') return 'psicologo';
      return 'usuario';
    }

    // string
    let s = this.stripAccents(asStr.toLowerCase()).replace(/\s+/g, ' ');
    if (['admin', 'administrator', 'administrador'].includes(s)) return 'admin';
    if (['psicologo', 'psicologa', 'psychologist', 'terapeuta', 'terapista', 'profesional'].includes(s)) {
      return 'psicologo';
    }
    return 'usuario';
  }

  /** Devuelve el usuario con password incluido (select:false en la entidad) + role */
  private async findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  /**
   * Login principal: valida credenciales, normaliza rol y devuelve JWT + datos básicos
   * Respuesta:
   * { access_token, sub, name, role }
   */
  async login(email: string, password: string) {
    const u = await this.findByEmailWithPassword(email);
    if (!u) throw new BadRequestException('Credenciales inválidas');

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) throw new BadRequestException('Credenciales inválidas');

    const role: UserRole = this.normalizeRole((u as any).role ?? (u as any).roleId);

    const payload = {
      sub: u.id,
      name: (u as any).name ?? (u as any).fullName ?? u.email, // fallback
      role, // 'admin' | 'psicologo' | 'usuario'
    };

    const access_token = await this.jwt.signAsync(payload);

    return {
      access_token,
      sub: payload.sub,
      name: payload.name,
      role: payload.role,
    };
  }

  /**
   * Método auxiliar si ya lo estás usando en algún controlador:
   * valida y devuelve la entidad sin password + token (igual que login()).
   * Mantengo la firma para compatibilidad con tu versión anterior.
   */
  async validateLogin(email: string, password: string) {
    const u = await this.findByEmailWithPassword(email);
    if (!u) throw new BadRequestException('Credenciales inválidas');

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) throw new BadRequestException('Credenciales inválidas');

    const role: UserRole = this.normalizeRole((u as any).role ?? (u as any).roleId);

    // limpiamos password
    const { password: _pwd, ...clean } = u as any;

    const payload = {
      sub: clean.id,
      name: clean.name ?? clean.fullName ?? clean.email,
      role,
    };

    const access_token = await this.jwt.signAsync(payload);

    return {
      user: { ...clean, role }, // por si algún consumidor espera un objeto user
      access_token,
      sub: payload.sub,
      name: payload.name,
      role: payload.role,
    };
  }
}
