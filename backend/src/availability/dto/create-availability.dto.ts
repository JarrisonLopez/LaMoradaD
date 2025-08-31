import { IsDateString, IsInt } from 'class-validator';
export class CreateAvailabilityDto {
  @IsInt() professionalId: number;
  @IsDateString() from: string;
  @IsDateString() to: string;
}
