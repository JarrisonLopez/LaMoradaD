import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProfessionalProfileDto {
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsInt() @Min(0) experienceYears?: number;
  @IsOptional() @IsString() services?: string; // CSV o JSON
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() photoUrl?: string;
}
