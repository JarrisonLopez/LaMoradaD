import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(@InjectRepository(Role) private repo: Repository<Role>) {}

  async onModuleInit() {
    for (const name of ['admin', 'psicologo', 'usuario']) {
      const exists = await this.repo.findOne({ where: { name } });
      if (!exists) await this.repo.save(this.repo.create({ name }));
    }
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('El rol ya existe');

    try {
      return await this.repo.save(this.repo.create(dto));
    } catch (e: any) {
      // Código de Postgres para unique_violation
      if (e?.code === '23505') {
        throw new BadRequestException('El rol ya existe');
      }
      throw e;
    }
  }

  findAll() {
    return this.repo.find();
  }
}
