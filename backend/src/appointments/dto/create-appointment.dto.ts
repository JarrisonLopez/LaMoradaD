import { IsDateString, IsInt } from 'class-validator';
export class CreateAppointmentDto {
  @IsInt() userId: number;
  @IsInt() professionalId: number;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
}
