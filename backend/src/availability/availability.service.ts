// backend/src/availability/availability.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';

// Entrada interna que arma el controller
type CreateAvailabilityInput = {
  professionalId: number;
  start: Date;
  end: Date;
};

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability) private repo: Repository<Availability>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Appointment) private apRepo: Repository<Appointment>,
  ) {}

  async create(input: CreateAvailabilityInput) {
    const professional = await this.users.findOne({
      where: { id: input.professionalId },
    });
    if (!professional) throw new BadRequestException('Profesional inválido');

    const from = input.start;
    const to = input.end;
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
      throw new BadRequestException('Rango de disponibilidad inválido');
    }

    const avail = this.repo.create({ professional, from, to, active: true });
    return this.repo.save(avail);
  }

  /**
   * Soft delete: marca active=false.
   * Solo el dueño (psicólogo) o un admin pueden hacerlo.
   */
  async deactivate(
    id: number,
    requesterId: number,
    requesterRole: 'admin' | 'psicologo' | 'usuario',
  ) {
    const avail = await this.repo.findOne({
      where: { id },
      relations: { professional: true },
    });
    if (!avail) throw new NotFoundException('Disponibilidad no existe');

    const isOwner = avail.professional?.id === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!(isOwner || isAdmin)) {
      throw new ForbiddenException(
        'No autorizado para eliminar esta disponibilidad',
      );
    }

    if (!avail.active) return avail; // ya inactiva
    avail.active = false;
    return this.repo.save(avail);
  }

  /**
   * Listado por profesional (activas), mostrando las últimas primero.
   */
  listByProfessional(professionalId: number) {
    return this.repo.find({
      where: { professional: { id: professionalId }, active: true },
      order: { from: 'DESC', id: 'DESC' },
    });
  }

  /**
   * Listado "mine": activas del usuario autenticado (últimas primero).
   * Úsalo desde el controller en GET /availability/mine con req.user.sub
   */
  findMine(userId: number) {
    return this.repo.find({
      where: { professional: { id: userId }, active: true },
      order: {
        from: 'DESC',
        id: 'DESC', // desempate estable si varias tienen mismo "from"
        // Si tienes createdAt en la entidad, puedes preferir:
        // createdAt: 'DESC'
      },
    });
  }

  // ===== Compatibilidad con distintos nombres que pueda usar el controller =====

  // Si el controller llama listAll() → devolvemos activas
  listAll() {
    return this.listAllActive();
  }

  // Si el controller llama findAll() → alias
  findAll() {
    return this.listAll();
  }

  // Si el controller llama getSlots(id) → tomamos el día actual por defecto
  getSlots(professionalId: number) {
    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD (UTC)
    return this.generateSlotsForDay(professionalId, today);
  }

  // Si el controller llama findSlots(id) → alias
  findSlots(professionalId: number) {
    return this.getSlots(professionalId);
  }

  // ===== Lógica existente =====

  /**
   * Listado global de activas (últimas primero).
   */
  listAllActive() {
    return this.repo.find({
      where: { active: true },
      order: { from: 'DESC', id: 'DESC' },
    });
  }

  async generateSlotsForDay(
    professionalId: number,
    dateISO: string,
    intervalMinutes = 15,
  ) {
    if (!dateISO) throw new BadRequestException('date requerido (YYYY-MM-DD)');
    const dayStart = new Date(`${dateISO}T00:00:00.000Z`);
    if (isNaN(dayStart.getTime()))
      throw new BadRequestException('date inválido (YYYY-MM-DD)');
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const windows = await this.repo.find({
      where: {
        professional: { id: professionalId },
        active: true,
        from: Between(new Date(dayStart.getTime() - 24 * 3600e3), dayEnd),
      },
      order: { from: 'DESC', id: 'DESC' }, // no afecta la generación, solo el recorrido
    });

    if (!windows.length) {
      return {
        professionalId,
        date: dateISO,
        interval: intervalMinutes,
        slots: [],
      };
    }

    const appts = await this.apRepo.find({
      where: {
        professional: { id: professionalId },
        startsAt: Between(dayStart, dayEnd),
        status: Not('cancelled'),
      },
    });

    const slots: Array<{ start: string; end: string; available: boolean }> = [];
    const step = intervalMinutes * 60_000;

    for (const w of windows) {
      const wStart = new Date(Math.max(w.from.getTime(), dayStart.getTime()));
      const wEnd = new Date(Math.min(w.to.getTime(), dayEnd.getTime()));
      if (wEnd <= wStart) continue;

      for (let t = wStart.getTime(); t + step <= wEnd.getTime(); t += step) {
        const s = new Date(t);
        const e = new Date(t + step);
        const busy = appts.some((ap) => ap.startsAt < e && ap.endsAt > s);
        const hhmm = (d: Date) => d.toISOString().substring(11, 16); // "HH:MM" UTC
        slots.push({ start: hhmm(s), end: hhmm(e), available: !busy });
      }
    }

    return { professionalId, date: dateISO, interval: intervalMinutes, slots };
  }
}
