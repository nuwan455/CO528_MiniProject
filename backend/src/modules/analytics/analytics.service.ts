import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [activeUsers, posts, jobs, applications, rsvps, projects, conversations] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.post.count(),
        this.prisma.job.count(),
        this.prisma.jobApplication.count(),
        this.prisma.eventRSVP.count(),
        this.prisma.researchProject.count(),
        this.prisma.conversation.count(),
      ]);

    return {
      message: 'Analytics overview fetched successfully',
      data: {
        activeUsers,
        posts,
        jobs,
        applications,
        eventRsvps: rsvps,
        mostActiveModules: [
          { module: 'posts', count: posts },
          { module: 'jobs', count: jobs + applications },
          { module: 'events', count: rsvps },
          { module: 'research', count: projects },
          { module: 'messaging', count: conversations },
        ].sort((a, b) => b.count - a.count),
      },
    };
  }

  async posts() {
    const [count, comments, likes, shares] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.comment.count(),
      this.prisma.like.count(),
      this.prisma.share.count(),
    ]);
    return { message: 'Post analytics fetched successfully', data: { count, comments, likes, shares } };
  }

  async jobs() {
    const [count, applications] = await Promise.all([
      this.prisma.job.count(),
      this.prisma.jobApplication.count(),
    ]);
    return { message: 'Job analytics fetched successfully', data: { count, applications } };
  }

  async events() {
    const [count, rsvpTotals] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.eventRSVP.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);
    return { message: 'Event analytics fetched successfully', data: { count, rsvpTotals } };
  }
}
