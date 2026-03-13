import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddCollaboratorDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  roleInProject!: string;
}
