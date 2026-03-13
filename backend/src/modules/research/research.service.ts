import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { AuthUser } from '../../shared/types/auth-user.type';
import { buildPagination } from '../../shared/utils/pagination.util';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ResearchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateProjectDto) {
    const project = await this.prisma.researchProject.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId: user.sub,
        tags: dto.tags ?? [],
        documentUrl: dto.documentUrl,
      },
      include: this.projectInclude,
    });
    return { message: 'Research project created successfully', data: project };
  }

  async findAll(query: PaginationQueryDto) {
    const where: Prisma.ResearchProjectWhereInput = query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
            { tags: { has: query.q } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.researchProject.findMany({
        where,
        include: this.projectInclude,
        orderBy: { createdAt: 'desc' },
        ...buildPagination(query.page, query.limit),
      }),
      this.prisma.researchProject.count({ where }),
    ]);
    return { message: 'Research projects fetched successfully', data: { items, meta: { total, page: query.page, limit: query.limit } } };
  }

  async findOne(id: string) {
    const project = await this.prisma.researchProject.findUnique({
      where: { id },
      include: this.projectInclude,
    });
    if (!project) {
      throw new NotFoundException('Research project not found');
    }
    return { message: 'Research project fetched successfully', data: project };
  }

  async update(id: string, user: AuthUser, dto: UpdateProjectDto) {
    await this.ensureOwnership(id, user);
    const project = await this.prisma.researchProject.update({
      where: { id },
      data: dto,
      include: this.projectInclude,
    });
    return { message: 'Research project updated successfully', data: project };
  }

  async remove(id: string, user: AuthUser) {
    await this.ensureOwnership(id, user);
    await this.prisma.researchProject.delete({ where: { id } });
    return { message: 'Research project deleted successfully', data: null };
  }

  async addCollaborator(id: string, user: AuthUser, dto: AddCollaboratorDto) {
    await this.ensureOwnership(id, user);
    const collaborator = await this.prisma.researchCollaborator.upsert({
      where: { projectId_userId: { projectId: id, userId: dto.userId } },
      update: { roleInProject: dto.roleInProject },
      create: { projectId: id, userId: dto.userId, roleInProject: dto.roleInProject },
    });
    return { message: 'Collaborator saved successfully', data: collaborator };
  }

  async listCollaborators(id: string) {
    const items = await this.prisma.researchCollaborator.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, email: true, headline: true } } },
    });
    return { message: 'Collaborators fetched successfully', data: items };
  }

  private async ensureOwnership(id: string, user: AuthUser): Promise<void> {
    const project = await this.prisma.researchProject.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Research project not found');
    }
    if (project.ownerId !== user.sub && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot modify this project');
    }
  }

  private readonly projectInclude = {
    owner: { select: { id: true, name: true, role: true } },
    collaborators: {
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    },
  } satisfies Prisma.ResearchProjectInclude;
}
