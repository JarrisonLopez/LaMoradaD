import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Post() create(@Body() dto: CreateAvailabilityDto) { return this.service.create(dto); }

  @Get('professional/:id')
  byProfessional(@Param('id', ParseIntPipe) id: number) {
    return this.service.listByProfessional(id);
  }

  @Get() all() { return this.service.listAllActive(); }
}
