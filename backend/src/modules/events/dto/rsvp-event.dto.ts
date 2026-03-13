import { ApiProperty } from '@nestjs/swagger';
import { RSVPStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class RsvpEventDto {
  @ApiProperty({ enum: RSVPStatus })
  @IsEnum(RSVPStatus)
  status!: RSVPStatus;
}
