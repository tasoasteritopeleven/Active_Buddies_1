import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, MessageType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateConversationDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId, leftAt: null } } },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, content: true, createdAt: true, senderId: true, type: true },
        },
      },
    });
    return conversations.map((c) => ({
      ...c,
      lastMessage: c.messages[0] ?? null,
      messages: undefined,
    }));
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const type = dto.type ?? ConversationType.DIRECT;
    const participantIds = Array.from(new Set([userId, ...dto.participantIds]));

    if (type === ConversationType.DIRECT) {
      if (participantIds.length !== 2) {
        throw new BadRequestException('DIRECT conversation requires exactly 2 participants');
      }
      // Reuse if already exists
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          AND: participantIds.map((pid) => ({
            participants: { some: { userId: pid, leftAt: null } },
          })),
        },
        include: { participants: true },
      });
      if (existing && existing.participants.length === 2) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type,
        name: type === ConversationType.GROUP ? dto.name ?? null : null,
        participants: {
          create: participantIds.map((pid) => ({
            userId: pid,
            isAdmin: pid === userId && type === ConversationType.GROUP,
          })),
        },
      },
      include: { participants: true },
    });
  }

  async assertParticipant(conversationId: string, userId: string): Promise<void> {
    const p = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!p || p.leftAt) throw new ForbiddenException('Not a participant of this conversation');
  }

  async listMessages(conversationId: string, userId: string, limit: number, offset: number) {
    await this.assertParticipant(conversationId, userId);
    const items = await this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    return items.reverse();
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    await this.assertParticipant(conversationId, userId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: dto.content,
          type: dto.type ?? MessageType.TEXT,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.assertParticipant(conversationId, userId);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }
}
