import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles as AllowRoles } from '../common/auth/roles.decorator'; // strings: 'admin'|'psicologo'|'usuario'

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  /**
   * Crear cita
   * - usuario: crea para sí mismo (userId = req.user.sub) y elige professionalId
   * - psicologo: crea para un paciente (userId requerido) y professionalId = req.user.sub si no viene
   * - admin: puede especificar userId y professionalId libremente
   */
  @AllowRoles('usuario', 'psicologo', 'admin')
  @Post()
  async create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    const me = req.user;
    const myId = me?.sub;
    const myRole: 'admin' | 'psicologo' | 'usuario' =
      typeof me?.role === 'string' ? me.role : (me?.role?.name ?? 'usuario');

    if (myRole === 'admin') {
      // admin: pasa tal cual (puede enviar userId/professionalId)
      return this.service.create(dto);
    }

    if (myRole === 'psicologo') {
      // psicólogo: userId (paciente) es obligatorio; professionalId se fija a su propio id si no viene
      if (!dto.userId) throw new ForbiddenException('Falta seleccionar paciente (userId)');
      if (!dto.professionalId) dto.professionalId = myId;
      return this.service.create(dto);
    }

    // usuario: siempre para sí mismo; professionalId debe venir elegido
    dto.userId = myId;
    return this.service.create(dto);
  }

  /**
   * Listado de citas (según rol)
   * - admin: todas o por professionalId+date
   * - psicologo: su agenda del día (date requerido)
   * - usuario: sus citas (todas si sin date; o por date)
   */
  @AllowRoles('usuario', 'psicologo', 'admin')
  @Get()
  async findByQuery(
    @Query('date') date?: string,
    @Query('professionalId') professionalId?: string,
    @Req() req?: any,
  ) {
    const me = req.user;
    const myId = me?.sub;
    const myRole: 'admin' | 'psicologo' | 'usuario' =
      typeof me?.role === 'string' ? me.role : (me?.role?.name ?? 'usuario');

    if (myRole === 'admin') {
      if (date && professionalId) {
        return this.service.listByProfessionalAndDate(Number(professionalId), date);
      }
      return this.service.findAll();
    }

    if (myRole === 'psicologo') {
      if (!date) throw new ForbiddenException('Falta date');
      return this.service.listByProfessionalAndDate(myId, date);
    }

    // usuario
    if (date) return this.service.listByUserAndDate(myId, date);
    return this.service.listByUser(myId);
  }

  // Cancelar: admin, dueño (user) o psicólogo de la cita
  @AllowRoles('usuario', 'psicologo', 'admin')
  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.cancelWithPolicy(id, req.user);
  }

  // Reprogramar: admin, dueño, psicólogo
  @AllowRoles('usuario', 'psicologo', 'admin')
  @Patch(':id')
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateAppointmentDto>,
    @Req() req: any,
  ) {
    return this.service.rescheduleWithPolicy(id, dto, req.user);
  }
}
