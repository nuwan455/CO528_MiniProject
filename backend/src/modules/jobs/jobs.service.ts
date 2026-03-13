import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../shared/types/auth-user.type';
import { buildPagination } from '../../shared/utils/pagination.util';
import { ApplyJobDto } from './dto/apply-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: { ...dto, deadline: new Date(dto.deadline), postedByUserId: user.sub },
      include: this.jobInclude,
    });
    return { message: 'Job created successfully', data: job };
  }

  async findAll(query: JobsQueryDto) {
    const where: Prisma.JobWhereInput = {
      company: query.company ? { contains: query.company, mode: 'insensitive' } : undefined,
      type: query.type,
      OR: query.q
        ? [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
            { location: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: this.jobInclude,
        orderBy: { createdAt: 'desc' },
        ...buildPagination(query.page, query.limit),
      }),
      this.prisma.job.count({ where }),
    ]);

    return { message: 'Jobs fetched successfully', data: { items, meta: { total, page: query.page, limit: query.limit } } };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id }, include: this.jobInclude });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return { message: 'Job fetched successfully', data: job };
  }

  async update(id: string, user: AuthUser, dto: UpdateJobDto) {
    await this.ensureOwnership(id, user);
    const job = await this.prisma.job.update({
      where: { id },
      data: { ...dto, deadline: dto.deadline ? new Date(dto.deadline) : undefined },
      include: this.jobInclude,
    });
    return { message: 'Job updated successfully', data: job };
  }

  async remove(id: string, user: AuthUser) {
    await this.ensureOwnership(id, user);
    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted successfully', data: null };
  }

  async apply(id: string, user: AuthUser, dto: ApplyJobDto) {
    const application = await this.prisma.jobApplication.upsert({
      where: { jobId_applicantId: { jobId: id, applicantId: user.sub } },
      update: { resumeUrl: dto.resumeUrl, coverLetter: dto.coverLetter, status: ApplicationStatus.APPLIED },
      create: {
        jobId: id,
        applicantId: user.sub,
        resumeUrl: dto.resumeUrl,
        coverLetter: dto.coverLetter,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: user.sub,
        type: 'JOB_APPLICATION',
        title: 'Application submitted',
        body: 'Your application has been submitted.',
        relatedEntityType: 'JOB',
        relatedEntityId: id,
      },
    });

    return { message: 'Application submitted successfully', data: application };
  }

  async listApplications(id: string, user: AuthUser) {
    await this.ensureOwnership(id, user);
    const items = await this.prisma.jobApplication.findMany({
      where: { jobId: id },
      include: { applicant: { select: { id: true, name: true, email: true, headline: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Applications fetched successfully', data: items };
  }

  async myApplications(user: AuthUser) {
    const items = await this.prisma.jobApplication.findMany({
      where: { applicantId: user.sub },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'My applications fetched successfully', data: items };
  }

  private async ensureOwnership(id: string, user: AuthUser): Promise<void> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.postedByUserId !== user.sub && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot modify this job');
    }
  }

  private readonly jobInclude = {
    postedBy: { select: { id: true, name: true, role: true } },
    _count: { select: { applications: true } },
  } satisfies Prisma.JobInclude;
}
