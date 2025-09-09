import { IsISO8601 } from 'class-validator';

export class CreateAvailabilityDto {
  @IsISO8601() start!: string; // "2025-09-01T08:00:00.000Z"
  @IsISO8601() end!: string;   // "2025-09-01T10:00:00.000Z"
}
