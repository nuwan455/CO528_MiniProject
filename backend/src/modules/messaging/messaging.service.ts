import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConversationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../shared/types/auth-user.type';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(user: AuthUser, dto: CreateConversationDto) {
    const participantIds = Array.from(new Set([user.sub, ...dto.participantIds]));
    if (dto.type === ConversationType.DIRECT && participantIds.length !== 2) {
      throw new ForbiddenException('Direct conversations require exactly two participants');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type,
        title: dto.title,
        participants: {
          create: participantIds.map((participantId) => ({ userId: participantId })),
        },
      },
      include: this.conversationInclude,
    });

    return { message: 'Conversation created successfully', data: conversation };
  }

  async listConversations(user: AuthUser) {
    const items = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId: user.sub } } },
      include: this.conversationInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return { message: 'Conversations fetched successfully', data: items };
  }

  async getConversation(id: string, user: AuthUser) {
    await this.ensureParticipant(id, user.sub);
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        ...this.conversationInclude,
        messages: {
          include: { sender: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return { message: 'Conversation fetched successfully', data: conversation };
  }

  async createMessage(id: string, user: AuthUser, dto: CreateMessageDto) {
    await this.ensureParticipant(id, user.sub);
    const message = await this.prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.sub,
        content: dto.content,
        messageType: dto.messageType,
        attachmentUrl: dto.attachmentUrl,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: id, userId: { not: user.sub } },
      select: { userId: true },
    });

    if (participants.length) {
      await this.prisma.notification.createMany({
        data: participants.map((participant) => ({
          userId: participant.userId,
          type: 'NEW_MESSAGE',
          title: 'New message received',
          body: dto.content.slice(0, 120),
          relatedEntityType: 'CONVERSATION',
          relatedEntityId: id,
        })),
      });
    }

    return { message: 'Message sent successfully', data: message };
  }

  async listMessages(id: string, user: AuthUser) {
    await this.ensureParticipant(id, user.sub);
    const items = await this.prisma.message.findMany({
      where: { conversationId: id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return { message: 'Messages fetched successfully', data: items };
  }

  private async ensureParticipant(conversationId: string, userId: string): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('You are not part of this conversation');
    }
  }

  private readonly conversationInclude = {
    participants: {
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    },
    _count: { select: { messages: true } },
  } as const;
}
