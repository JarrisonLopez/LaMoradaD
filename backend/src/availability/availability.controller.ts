// backend/src/availability/availability.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  /** Crea disponibilidad del usuario autenticado (psicólogo/admin) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  create(@Body() dto: CreateAvailabilityDto, @Req() req: any) {
    return this.service.create({
      professionalId: req.user.sub,
      start: new Date(dto.start),
      end: new Date(dto.end),
    });
  }

  /** Mis disponibilidades activas (últimas primero) */
  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  mine(@Req() req: any) {
    // Usamos el método específico para "mine" (orden DESC)
    return this.service.findMine(req.user.sub);
  }

  /** Disponibilidades activas por profesional (últimas primero) */
  @Get('professional/:id')
  getByProfessional(@Param('id', ParseIntPipe) id: number) {
    const s: any = this.service as any;
    return s.listByProfessional ? s.listByProfessional(id) : s.findByProfessional(id);
  }

  /** Listado global de activas (compatibilidad con listAll/findAll) */
  @Get()
  listAll() {
    const s: any = this.service as any;
    return s.listAll ? s.listAll() : s.findAll();
  }

  /** Slots del día (intervalo default 15m; acepta ?date=YYYY-MM-DD&interval=15) */
  @Get('professional/:id/slots')
  getSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date?: string,
    @Query('interval') interval?: string,
  ) {
    const d =
      date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Date().toISOString().slice(0, 10);
    const iv = interval ? Math.max(5, parseInt(interval, 10)) : 15;
    return this.service.generateSlotsForDay(id, d, iv);
  }

  /** Soft delete: marca active=false (dueño o admin) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('psicologo', 'admin')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.deactivate(id, req.user.sub, req.user.role);
  }
}
