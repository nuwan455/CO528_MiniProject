import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../shared/types/auth-user.type';
import { buildPagination } from '../../shared/utils/pagination.util';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsQueryDto } from './dto/events-query.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        bannerUrl: dto.bannerUrl,
        createdByUserId: user.sub,
      },
      include: this.eventInclude,
    });

    const recipients =
      user.role === Role.ADMIN
        ? await this.prisma.user.findMany({
            where: { id: { not: user.sub } },
            select: { id: true },
          })
        : await this.prisma.user.findMany({
            where: { role: Role.ADMIN, id: { not: user.sub } },
            select: { id: true },
          });

    if (recipients.length) {
      await this.prisma.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          type: 'EVENT',
          title: user.role === Role.ADMIN ? 'New department event published' : 'New event submitted',
          body:
            user.role === Role.ADMIN
              ? `"${event.title}" is now available for the department community.`
              : `An alumni event, "${event.title}", was created and is ready for review.`,
          relatedEntityType: 'EVENT',
          relatedEntityId: event.id,
        })),
      });
    }

    return { message: 'Event created successfully', data: event };
  }

  async findAll(query: EventsQueryDto) {
    const where: Prisma.EventWhereInput = {
      location: query.location ? { contains: query.location, mode: 'insensitive' } : undefined,
      startTime: query.upcoming === 'true' ? { gte: new Date() } : undefined,
      OR: query.q
        ? [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: this.eventInclude,
        orderBy: { startTime: 'asc' },
        ...buildPagination(query.page, query.limit),
      }),
      this.prisma.event.count({ where }),
    ]);
    return { message: 'Events fetched successfully', data: { items, meta: { total, page: query.page, limit: query.limit } } };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, include: this.eventInclude });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return { message: 'Event fetched successfully', data: event };
  }

  async update(id: string, user: AuthUser, dto: UpdateEventDto) {
    await this.ensureOwnership(id, user);
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        bannerUrl: dto.bannerUrl,
      },
      include: this.eventInclude,
    });
    return { message: 'Event updated successfully', data: event };
  }

  async remove(id: string, user: AuthUser) {
    await this.ensureOwnership(id, user);
    await this.prisma.event.delete({ where: { id } });
    return { message: 'Event deleted successfully', data: null };
  }

  async rsvp(id: string, user: AuthUser, dto: RsvpEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, createdByUserId: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const rsvp = await this.prisma.eventRSVP.upsert({
      where: { eventId_userId: { eventId: id, userId: user.sub } },
      update: { status: dto.status },
      create: { eventId: id, userId: user.sub, status: dto.status },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, id: { not: user.sub } },
      select: { id: true },
    });
    const recipientIds = Array.from(new Set([event.createdByUserId, ...admins.map((admin) => admin.id)])).filter(
      (recipientId) => recipientId !== user.sub,
    );

    if (recipientIds.length) {
      await this.prisma.notification.createMany({
        data: recipientIds.map((recipientId) => ({
          userId: recipientId,
          type: 'EVENT',
          title: 'New RSVP received',
          body: `${user.email} responded "${dto.status.replaceAll('_', ' ')}" to "${event.title}".`,
          relatedEntityType: 'EVENT',
          relatedEntityId: id,
        })),
      });
    }

    return { message: 'RSVP saved successfully', data: rsvp };
  }

  async listRsvps(id: string) {
    const items = await this.prisma.eventRSVP.findMany({
      where: { eventId: id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    return { message: 'RSVPs fetched successfully', data: items };
  }

  private async ensureOwnership(id: string, user: AuthUser): Promise<void> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.createdByUserId !== user.sub && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot modify this event');
    }
  }

  private readonly eventInclude = {
    createdBy: { select: { id: true, name: true, role: true } },
    _count: { select: { rsvps: true } },
  } satisfies Prisma.EventInclude;
}
