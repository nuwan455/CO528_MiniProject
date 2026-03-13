import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyJobDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resumeUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(3000)
  @IsOptional()
  coverLetter?: string;
}
