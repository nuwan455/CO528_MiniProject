import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostVisibility } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';

export class PostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ enum: PostVisibility })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;
}
