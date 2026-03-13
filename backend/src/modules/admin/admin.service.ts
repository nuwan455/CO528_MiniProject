import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async users() {
    const items = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        batchYear: true,
        createdAt: true,
      },
    });
    return { message: 'Admin users fetched successfully', data: items };
  }

  async reports() {
    const [users, students, alumni, admins, posts, jobs, events, flaggedCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.ALUMNI } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.post.count(),
      this.prisma.job.count(),
      this.prisma.event.count(),
      this.prisma.notification.count({ where: { type: 'REPORT' } }),
    ]);

    return {
      message: 'Admin reports fetched successfully',
      data: {
        users,
        roleBreakdown: { students, alumni, admins },
        posts,
        jobs,
        events,
        flaggedCount,
      },
    };
  }

  async deletePost(id: string) {
    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted by admin', data: null };
  }

  async deleteJob(id: string) {
    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted by admin', data: null };
  }
}
