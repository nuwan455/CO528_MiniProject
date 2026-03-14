import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AuthUser } from '../../shared/types/auth-user.type';
import { ApplyJobDto } from './dto/apply-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Roles(Role.ALUMNI, Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user, dto);
  }

  @Get('my/applications')
  myApplications(@CurrentUser() user: AuthUser) {
    return this.jobsService.myApplications(user);
  }

  @Roles(Role.ADMIN)
  @Get(':id/applications')
  listApplications(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.listApplications(id, user);
  }

  @Post(':id/apply')
  apply(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: ApplyJobDto) {
    return this.jobsService.apply(id, user, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(id, user, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.remove(id, user);
  }

  @Get()
  findAll(@Query() query: JobsQueryDto) {
    return this.jobsService.findAll(query);
  }
}
