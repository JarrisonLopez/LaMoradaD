import { IsNumber, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateEbookDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }) => (value ?? '').toString().trim())
  title!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const v = (value ?? '').toString().trim();
    return v === '' ? undefined : v;
  })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  price?: number;

  // ahora acepta path relativo '/uploads/ebooks/...' o URL absoluta
  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }) => {
    const v = (value ?? '').toString().trim();
    return v === '' ? undefined : v;
  })
  fileUrl?: string;
}
