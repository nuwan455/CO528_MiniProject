import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';

const PostVisibility = {
  PUBLIC: 'PUBLIC',
  DEPARTMENT_ONLY: 'DEPARTMENT_ONLY',
  ALUMNI_ONLY: 'ALUMNI_ONLY',
} as const;

export class PostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ enum: PostVisibility })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: (typeof PostVisibility)[keyof typeof PostVisibility];
}
