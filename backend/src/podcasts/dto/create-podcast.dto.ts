import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePodcastDto {
  @IsString() @IsNotEmpty() @MaxLength(180)
  title: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsOptional() @MaxLength(80)
  category?: string;
}
