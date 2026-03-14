import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const PostMediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
  NONE: 'NONE',
} as const;

const PostVisibility = {
  PUBLIC: 'PUBLIC',
  DEPARTMENT_ONLY: 'DEPARTMENT_ONLY',
  ALUMNI_ONLY: 'ALUMNI_ONLY',
} as const;

export class CreatePostDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({ enum: PostMediaType, default: PostMediaType.NONE })
  @IsEnum(PostMediaType)
  @IsOptional()
  mediaType?: (typeof PostMediaType)[keyof typeof PostMediaType];

  @ApiPropertyOptional({ enum: PostVisibility, default: PostVisibility.PUBLIC })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: (typeof PostVisibility)[keyof typeof PostVisibility];
}
