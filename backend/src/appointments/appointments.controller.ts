import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post() create(@Body() dto: CreateAppointmentDto) { return this.service.create(dto); }
  @Get()  findAll() { return this.service.findAll(); }
  @Delete(':id') cancel(@Param('id', ParseIntPipe) id: number) { return this.service.cancel(id); }
}
