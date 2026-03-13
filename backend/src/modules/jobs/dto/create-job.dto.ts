import { ApiProperty } from '@nestjs/swagger';
import { JobType } from '@prisma/client';
import { IsDateString, IsEnum, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  company!: string;

  @ApiProperty()
  @IsString()
  location!: string;

  @ApiProperty({ enum: JobType })
  @IsEnum(JobType)
  type!: JobType;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  description!: string;

  @ApiProperty()
  @IsDateString()
  deadline!: string;
}
