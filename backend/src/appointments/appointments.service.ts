import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { User } from '../entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private repo: Repository<Appointment>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  // ----------------- helpers -----------------
  /** Acepta actor como { sub, id, userId, role | role.name } y normaliza a { id:number|null, role:string|null } */
  private normalizeActor(actor: any) {
    const rawId =
      actor?.sub ??
      actor?.id ??
      actor?.userId ??
      actor?.user?.id ??
      null;

    const id =
      typeof rawId === 'string' ? parseInt(rawId, 10) : (rawId as number | null);

    const role =
      typeof actor?.role === 'string'
        ? actor.role
        : actor?.role?.name ?? actor?.user?.role?.name ?? null;

    return { id, role };
  }

  private async mustUser(id: number) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new BadRequestException('Usuario inválido');
    return u;
  }

  // ----------------- create -----------------
  async create(dto: CreateAppointmentDto) {
    const [user, professional] = await Promise.all([
      this.users.findOne({ where: { id: dto.userId } }),
      this.users.findOne({ where: { id: dto.professionalId } }),
    ]);
    if (!user || !professional) throw new BadRequestException('Usuario o profesional inválido');

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (isNaN(startsAt.getTime())) throw new BadRequestException('startsAt inválido');
    if (isNaN(endsAt.getTime())) throw new BadRequestException('endsAt inválido');
    if (endsAt <= startsAt) throw new BadRequestException('Rango de tiempo inválido');

    // Solape robusto: A.start < B.end && A.end > B.start
    const overlap = await this.repo.findOne({
      where: {
        professional: { id: professional.id },
        startsAt: LessThan(endsAt),
        endsAt: MoreThan(startsAt),
        status: Not('cancelled'),
      },
    });
    if (overlap) throw new BadRequestException('Horarios en conflicto');

    const ap = this.repo.create({ user, professional, startsAt, endsAt, status: 'scheduled' });
    return this.repo.save(ap);
  }

  // ----------------- reads -----------------
  findAll() {
    return this.repo.find({
      relations: { user: true, professional: true },
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: { user: true, professional: true },
    });
  }

  async listByProfessionalAndDate(professionalId: number, dateISO: string) {
    const day = new Date(`${dateISO}T00:00:00.000Z`);
    if (isNaN(day.getTime())) throw new BadRequestException('date inválida (YYYY-MM-DD)');
    const dayEnd = new Date(day);
    dayEnd.setUTCDate(day.getUTCDate() + 1);

    return this.repo.find({
      where: {
        professional: { id: professionalId },
        startsAt: Between(day, dayEnd),
        status: Not('cancelled'),
      },
      relations: { user: true, professional: true },
      order: { startsAt: 'ASC' },
    });
  }

  async listByUser(userId: number) {
    return this.repo.find({
      where: { user: { id: userId }, status: Not('cancelled') },
      relations: { user: true, professional: true },
      order: { startsAt: 'ASC' },
    });
  }

  async listByUserAndDate(userId: number, dateISO: string) {
    const day = new Date(`${dateISO}T00:00:00.000Z`);
    if (isNaN(day.getTime())) throw new BadRequestException('date inválida (YYYY-MM-DD)');
    const end = new Date(day);
    end.setUTCDate(day.getUTCDate() + 1);
    return this.repo.find({
      where: { user: { id: userId }, startsAt: Between(day, end), status: Not('cancelled') },
      relations: { user: true, professional: true },
      order: { startsAt: 'ASC' },
    });
  }

  // ----------------- policy actions -----------------
  async cancelWithPolicy(id: number, me: any) {
    const ap = await this.repo.findOne({
      where: { id },
      relations: { user: true, professional: true },
    });
    if (!ap) throw new BadRequestException('No existe');

    const { id: actorId, role } = this.normalizeActor(me);
    const isOwner = actorId != null && ap.user?.id === actorId;
    const isProfessional = actorId != null && ap.professional?.id === actorId;

    if (role === 'admin' || isOwner || isProfessional) {
      ap.status = 'cancelled';
      return this.repo.save(ap);
    }
    throw new ForbiddenException('No puedes cancelar esta cita');
  }

  async rescheduleWithPolicy(id: number, dto: Partial<CreateAppointmentDto>, me: any) {
    const ap = await this.repo.findOne({
      where: { id },
      relations: { user: true, professional: true },
    });
    if (!ap) throw new BadRequestException('No existe');

    const { id: actorId, role } = this.normalizeActor(me);
    const isOwner = actorId != null && ap.user?.id === actorId;
    const isProfessional = actorId != null && ap.professional?.id === actorId;

    if (!(role === 'admin' || isOwner || isProfessional)) {
      throw new ForbiddenException('No puedes modificar esta cita');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : ap.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : ap.endsAt;
    const professionalId = dto.professionalId ?? ap.professional?.id;

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime()))
      throw new BadRequestException('Fechas inválidas');
    if (endsAt <= startsAt) throw new BadRequestException('Rango de tiempo inválido');

    // Validación de solape para el profesional target
    const overlap = await this.repo.findOne({
      where: {
        professional: { id: professionalId },
        startsAt: LessThan(endsAt),
        endsAt: MoreThan(startsAt),
        status: Not('cancelled'),
        id: Not(id),
      },
    });
    if (overlap) throw new BadRequestException('Horarios en conflicto');

    ap.startsAt = startsAt;
    ap.endsAt = endsAt;

    if (dto.professionalId && dto.professionalId !== ap.professional?.id) {
      ap.professional = await this.mustUser(dto.professionalId);
    }
    if (dto.userId && dto.userId !== ap.user?.id) {
      ap.user = await this.mustUser(dto.userId);
    }

    return this.repo.save(ap);
  }

  // Cancelación directa (sin política) - se mantiene por compatibilidad si la usas en otro lado
  async cancel(id: number) {
    const ap = await this.repo.findOne({ where: { id } });
    if (!ap) throw new BadRequestException('No existe');
    ap.status = 'cancelled';
    return this.repo.save(ap);
  }
}
