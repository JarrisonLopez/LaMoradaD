import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProfessionalProfile } from '../entities/professional-profile.entity';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(ProfessionalProfile) private readonly profRepo: Repository<ProfessionalProfile>,
  ) {}

  async create(dto: CreateUserDto) {
    const role = dto.roleId
      ? await this.roles.findOne({ where: { id: dto.roleId } })
      : await this.roles.findOne({ where: { name: 'usuario' } });
    const u = this.repo.create({ ...dto, role });
    return this.repo.save(u);
  }

  async createAsUsuario(dto: CreateUserDto) {
    const role = await this.roles.findOne({ where: { name: 'usuario' } });
    const u = this.repo.create({ ...dto, role });
    return this.repo.save(u);
  }

  findAll() {
    return this.repo.find({ relations: { role: true }, order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const u = await this.repo.findOne({ where: { id }, relations: { role: true } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  async update(id: number, dto: UpdateUserDto) {
    const u = await this.findOne(id);
    if (dto.roleId) {
      u.role = await this.roles.findOne({ where: { id: dto.roleId } });
    }
    Object.assign(u, { ...dto, roleId: undefined });
    return this.repo.save(u);
  }

  async remove(id: number) {
    const u = await this.findOne(id);
    return this.repo.remove(u);
  }

  async findByRole(roleName: 'admin' | 'psicologo' | 'usuario') {
    return this.repo.find({
      where: { role: { name: roleName } },
      relations: { role: true },
      order: { id: 'DESC' },
    });
  }

  async findPatientsLite() {
    const rows = await this.findByRole('usuario');
    return rows.map(r => ({ id: r.id, name: (r as any).name, email: (r as any).email }));
  }

  /** Lista lite de psicólogos */
  async findProfessionalsLite() {
    const rows = await this.findByRole('psicologo');
    return rows.map(r => ({ id: r.id, name: (r as any).name, email: (r as any).email }));
  }

  /** HU-34: Lista completa de profesionales (sin select para evitar TS2322) */
  async listProfessionals() {
    const rows = await this.repo.find({
      where: { role: { name: 'psicologo' } },
      relations: ['role'],
      order: { id: 'ASC' },
    });
    return rows;
  }

  /** Obtener perfil de un profesional (por id de usuario) */
  async getProfessionalProfile(userId: string | number) {
    // tu PK parece numérica; normalizamos a number para el where
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
  async updateMyProfessionalProfile(userId: number | string, dto: UpdateProfessionalProfileDto) {
    const idNum = typeof userId === 'string' ? Number(userId) : userId;

    let profile = await this.profRepo.findOne({ where: { user: { id: idNum } as any } });
    if (!profile) {
      profile = this.profRepo.create({ user: { id: idNum } as any, ...dto });
    } else {
      Object.assign(profile, dto);
    }
    return this.profRepo.save(profile);
  }
}
