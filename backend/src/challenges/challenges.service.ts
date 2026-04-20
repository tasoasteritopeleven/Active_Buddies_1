import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import type { CreateChallengeDto, ListChallengesQueryDto } from './dto/challenges.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list(query: ListChallengesQueryDto) {
    const now = new Date();
    const where: Prisma.ChallengeWhereInput = {};
    if (query.status === 'active' || !query.status) {
      where.isActive = true;
      where.endDate = { gte: now };
    } else if (query.status === 'completed') {
      where.endDate = { lt: now };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.challenge.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: query.offset,
        take: query.limit,
        include: {
          _count: { select: { participants: true } },
        },
      }),
      this.prisma.challenge.count({ where }),
    ]);
    return { items, total };
  }

  async create(userId: string, dto: CreateChallengeDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid dates');
    }
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }
    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        challengeType: dto.challengeType,
        startDate: start,
        endDate: end,
        targetValue: dto.targetValue ?? null,
        createdById: userId,
      },
    });
  }

  async getById(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { participants: true } },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async join(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (!challenge.isActive || challenge.endDate < new Date()) {
      throw new BadRequestException('Challenge is not active');
    }
    try {
      const [participant] = await this.prisma.$transaction([
        this.prisma.challengeParticipant.create({
          data: { challengeId, userId },
        }),
        this.prisma.challenge.update({
          where: { id: challengeId },
          data: { participantsCount: { increment: 1 } },
        }),
      ]);
      return participant;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Already joined this challenge');
      }
      throw err;
    }
  }

  async leave(userId: string, challengeId: string): Promise<void> {
    const existing = await this.prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!existing) throw new NotFoundException('Not a participant');
    await this.prisma.$transaction([
      this.prisma.challengeParticipant.delete({ where: { id: existing.id } }),
      this.prisma.challenge.update({
        where: { id: challengeId },
        data: { participantsCount: { decrement: 1 } },
      }),
    ]);
  }

  async updateProgress(userId: string, challengeId: string, progress: number) {
    const participant = await this.prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: { challenge: { select: { targetValue: true, endDate: true } } },
    });
    if (!participant) throw new NotFoundException('Not a participant');

    const completed =
      participant.challenge.targetValue !== null &&
      progress >= participant.challenge.targetValue;

    const updated = await this.prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        progress,
        completedAt: completed && !participant.completedAt ? new Date() : participant.completedAt,
      },
    });

    await this.cache.del(`challenge:leaderboard:${challengeId}`);
    return updated;
  }

  async leaderboard(challengeId: string, limit = 50) {
    return this.cache.getOrSet(`challenge:leaderboard:${challengeId}:${limit}`, 300, async () => {
      const entries = await this.prisma.challengeParticipant.findMany({
        where: { challengeId },
        orderBy: [{ progress: 'desc' }, { joinedAt: 'asc' }],
        take: limit,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });
      return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
    });
  }
}
