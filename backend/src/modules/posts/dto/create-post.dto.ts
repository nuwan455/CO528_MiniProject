import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType, PostVisibility } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({ enum: MediaType, default: MediaType.NONE })
  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @ApiPropertyOptional({ enum: PostVisibility, default: PostVisibility.PUBLIC })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;
}
