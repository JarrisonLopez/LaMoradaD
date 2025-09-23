// src/users/users.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { ProfessionalProfile } from '../entities/professional-profile.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(ProfessionalProfile)
    private readonly profRepo: Repository<ProfessionalProfile>,
  ) {}

  /** =========== ADMIN: crear usuario con rol (opcional) =========== */
  async create(dto: CreateUserDto) {
    // Evitar duplicados por email
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email ya registrado');

    // Rol por id o por nombre ('usuario' por defecto)
    const role = dto.roleId
      ? await this.roles.findOne({ where: { id: dto.roleId } })
      : await this.roles.findOne({ where: { name: 'usuario' } });

    if (!role) throw new BadRequestException('Rol no válido');

    // Hash de contraseña
    const hashed = await bcrypt.hash(dto.password, 10);

    const u = this.repo.create({
      name: dto.name,
      email: dto.email,
      password: hashed, // ⚠️ guardar hash, no texto plano
      role,
    });

    return this.repo.save(u);
  }

  /** =========== Registro público: crea siempre como 'usuario' =========== */
  async createAsUsuario(dto: CreateUserDto) {
    // Evitar duplicados por email
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email ya registrado');

    const role = await this.roles.findOne({ where: { name: 'usuario' } });
    if (!role) throw new BadRequestException('Rol por defecto no encontrado');

    const hashed = await bcrypt.hash(dto.password, 10);

    const u = this.repo.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role,
    });

    return this.repo.save(u);
  }

  /** =========== Listados / lectura =========== */
  findAll() {
    return this.repo.find({ relations: { role: true }, order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const u = await this.repo.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  /** =========== Actualización =========== */
  async update(id: number, dto: UpdateUserDto) {
    const u = await this.findOne(id);

    // Cambiar rol si llega roleId
    if (dto.roleId) {
      const r = await this.roles.findOne({ where: { id: dto.roleId } });
      if (!r) throw new BadRequestException('Rol no encontrado');
      u.role = r;
    }

    // Si llega password, re-hashearla
    if ((dto as any).password) {
      (u as any).password = await bcrypt.hash((dto as any).password, 10);
    }

    // Asignar resto de campos (sin sobreescribir roleId ni password ya procesada)
    const { roleId, password, ...rest } = dto as any;
    Object.assign(u, rest);

    return this.repo.save(u);
  }

  /** =========== Eliminación =========== */
  async remove(id: number) {
    const u = await this.findOne(id);
    return this.repo.remove(u);
  }

  /** =========== Utilidades por rol =========== */
  async findByRole(roleName: 'admin' | 'psicologo' | 'usuario') {
    return this.repo.find({
      where: { role: { name: roleName } },
      relations: { role: true },
      order: { id: 'DESC' },
    });
  }

  async findPatientsLite() {
    const rows = await this.findByRole('usuario');
    return rows.map((r) => ({
      id: r.id,
      name: (r as any).name,
      email: (r as any).email,
    }));
  }

  /** Lista lite de psicólogos */
  async findProfessionalsLite() {
    const rows = await this.findByRole('psicologo');
    return rows.map((r) => ({
      id: r.id,
      name: (r as any).name,
      email: (r as any).email,
    }));
  }

  /** HU-34: Lista completa de profesionales */
  async listProfessionals() {
    return this.repo.find({
      where: { role: { name: 'psicologo' } },
      relations: ['role'],
      order: { id: 'ASC' },
    });
  }

  /** Obtener perfil de un profesional (por id de usuario) */
  async getProfessionalProfile(userId: string | number) {
    const idNum = typeof userId === 'string' ? Number(userId) : userId;
    const profile = await this.profRepo.findOne({
      where: { user: { id: idNum } as any },
      relations: ['user'],
    });
    if (!profile) {
      return {
        error: 'Perfil no disponible',
        message:
          'El perfil consultado no existe o fue eliminado. Regresa al listado de profesionales.',
      };
    }
    return profile;
  }

  /** Crear/actualizar el perfil del propio profesional */
  async updateMyProfessionalProfile(
    userId: number | string,
    dto: UpdateProfessionalProfileDto,
  ) {
    const idNum = typeof userId === 'string' ? Number(userId) : userId;

    let profile = await this.profRepo.findOne({
      where: { user: { id: idNum } as any },
    });
    if (!profile) {
      profile = this.profRepo.create({ user: { id: idNum } as any, ...dto });
    } else {
      Object.assign(profile, dto);
    }
    return this.profRepo.save(profile);
  }
}
