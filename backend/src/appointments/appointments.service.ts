import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { User } from '../entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private repo: Repository<Appointment>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const [user, professional] = await Promise.all([
      this.users.findOne({ where: { id: dto.userId } }),
      this.users.findOne({ where: { id: dto.professionalId } }),
    ]);
    if (!user || !professional) throw new BadRequestException('Usuario o profesional inválido');

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException('Rango de tiempo inválido');

    // validar choque simple
    const overlap = await this.repo.findOne({
      where: {
        professional: { id: professional.id },
        startsAt: Between(startsAt, endsAt),
      },
    });
    if (overlap) throw new BadRequestException('Horarios en conflicto');

    const ap = this.repo.create({ user, professional, startsAt, endsAt, status: 'scheduled' });
    return this.repo.save(ap);
  }

  findAll() { return this.repo.find(); }

  async cancel(id: number) {
    const ap = await this.repo.findOne({ where: { id } });
    if (!ap) throw new BadRequestException('No existe');
    ap.status = 'cancelled';
    return this.repo.save(ap);
  }
}
