import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { buildPagination } from '../../shared/utils/pagination.util';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  serializeUser(user: User) {
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Profile fetched successfully',
      data: this.serializeUser(user),
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        department: dto.department,
        batchYear: dto.batchYear,
        bio: dto.bio,
        profileImageUrl: dto.profileImageUrl,
        skills: dto.skills,
        headline: dto.headline,
      },
    });

    return {
      message: 'Profile updated successfully',
      data: this.serializeUser(user),
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User fetched successfully',
      data: this.serializeUser(user),
    };
  }

  async findAll(query: PaginationQueryDto) {
    const where: Prisma.UserWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
            { department: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...buildPagination(query.page, query.limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Users fetched successfully',
      data: {
        items: items.map((item) => this.serializeUser(item)),
        meta: {
          total,
          page: query.page,
          limit: query.limit,
        },
      },
    };
  }

  async search(query: string, pagination: PaginationQueryDto) {
    return this.findAll({ ...pagination, q: query });
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });

    return {
      message: 'User role updated successfully',
      data: this.serializeUser(user),
    };
  }
}
