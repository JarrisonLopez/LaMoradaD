import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString() @IsNotEmpty() @MaxLength(180)
  title: string;

  @IsString() @IsNotEmpty()
  content: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  category: string;

  @IsString() @IsOptional() @MaxLength(260)
  coverUrl?: string;
}
