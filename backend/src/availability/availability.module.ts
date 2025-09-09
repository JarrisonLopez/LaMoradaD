import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { Availability } from '../entities/availability.entity';
import { User } from '../entities/user.entity';
import { Appointment } from '../entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, User, Appointment])],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
