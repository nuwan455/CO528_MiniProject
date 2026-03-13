import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../shared/types/auth-user.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    const items = await this.prisma.notification.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Notifications fetched successfully', data: items };
  }

  async markRead(id: string, user: AuthUser) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.sub },
    });
    if (!notification) {
      return { message: 'Notification not found', data: null };
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { message: 'Notification marked as read', data: updated };
  }

  async markAllRead(user: AuthUser) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.sub, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read', data: result };
  }
}
