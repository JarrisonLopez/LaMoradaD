import { IsInt, IsISO8601, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  /** En flujo de USUARIO no se envía: lo pone el backend con req.user.sub */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  /** Siempre requerido (usuario elige profesional; psicólogo puede venir fijo a su id) */
  @Type(() => Number)
  @IsInt()
  professionalId!: number;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;
}
