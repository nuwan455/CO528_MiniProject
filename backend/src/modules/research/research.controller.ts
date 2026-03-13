import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { AuthUser } from '../../shared/types/auth-user.type';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ResearchService } from './research.service';

@ApiTags('Research')
@ApiBearerAuth()
@Controller('research/projects')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.researchService.create(user, dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.researchService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.researchService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateProjectDto) {
    return this.researchService.update(id, user, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.researchService.remove(id, user);
  }

  @Post(':id/collaborators')
  addCollaborator(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AddCollaboratorDto,
  ) {
    return this.researchService.addCollaborator(id, user, dto);
  }

  @Get(':id/collaborators')
  listCollaborators(@Param('id') id: string) {
    return this.researchService.listCollaborators(id);
  }
}
