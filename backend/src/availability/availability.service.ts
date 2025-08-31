import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { User } from '../entities/user.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability) private repo: Repository<Availability>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async create(dto: CreateAvailabilityDto) {
    const professional = await this.users.findOne({ where: { id: dto.professionalId } });
    if (!professional) throw new BadRequestException('Profesional inválido');

    const avail = this.repo.create({
      professional,
      from: new Date(dto.from),
      to: new Date(dto.to),
      active: true,
    });
    return this.repo.save(avail);
  }

  listByProfessional(professionalId: number) {
    return this.repo.find({ where: { professional: { id: professionalId }, active: true } });
  }

  listAllActive() { return this.repo.find({ where: { active: true } }); }
}
