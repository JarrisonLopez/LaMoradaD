import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class CreatePodcastUrlDto {
  @IsString() @IsNotEmpty() @MaxLength(180)
  title: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsOptional() @MaxLength(80)
  category?: string;

  // ✅ Acepta cualquier URL http(s), sin exigir extensión .mp3/.wav
  @IsUrl({ require_protocol: true })
  audioUrl: string;
}
