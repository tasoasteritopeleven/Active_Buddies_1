import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionStatus, NotificationType, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

export interface MatchSuggestion {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  fitnessLevel: string | null;
  goals: string[];
  locationCity: string | null;
  matchScore: number;
  sharedGoals: string[];
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Score 0..100 based on: shared goals (60%), same fitness level (25%),
   * same city (15%).
   */
  private computeMatchScore(
    me: { goals: string[]; fitnessLevel: string | null; locationCity: string | null },
    other: { goals: string[]; fitnessLevel: string | null; locationCity: string | null },
  ): { score: number; sharedGoals: string[] } {
    const myGoals = new Set(me.goals ?? []);
    const sharedGoals = (other.goals ?? []).filter((g) => myGoals.has(g));
    const goalsRatio = myGoals.size === 0 ? 0 : sharedGoals.length / myGoals.size;

    const fitnessMatch = me.fitnessLevel && me.fitnessLevel === other.fitnessLevel ? 1 : 0;
    const cityMatch =
      me.locationCity && other.locationCity &&
      me.locationCity.toLowerCase() === other.locationCity.toLowerCase()
        ? 1
        : 0;

    const score = Math.round(goalsRatio * 60 + fitnessMatch * 25 + cityMatch * 15);
    return { score: Math.min(100, Math.max(0, score)), sharedGoals };
  }

  async suggestions(userId: string, limit = 20, offset = 0): Promise<MatchSuggestion[]> {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { goals: true, fitnessLevel: true, locationCity: true },
    });
    if (!me) throw new NotFoundException('User not found');

    // Users already connected with me
    const existing = await this.prisma.connection.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });
    const excludeIds = new Set<string>([userId]);
    for (const c of existing) {
      excludeIds.add(c.requesterId);
      excludeIds.add(c.addresseeId);
    }

    // Candidate pool — over-fetch for scoring
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        fitnessLevel: true,
        goals: true,
        locationCity: true,
      },
      take: Math.min(500, limit * 5 + offset),
    });

    const scored = candidates
      .map((c) => {
        const { score, sharedGoals } = this.computeMatchScore(me, c);
        return {
          userId: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          avatarUrl: c.avatarUrl,
          fitnessLevel: c.fitnessLevel,
          goals: c.goals,
          locationCity: c.locationCity,
          matchScore: score,
          sharedGoals,
        } satisfies MatchSuggestion;
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(offset, offset + limit);

    return scored;
  }

  async sendRequest(requesterId: string, addresseeId: string, message?: string): Promise<Prisma.ConnectionGetPayload<object>> {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot connect with yourself');
    }
    const target = await this.prisma.user.findFirst({
      where: { id: addresseeId, isActive: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!target) throw new NotFoundException('Target user not found');

    // Check if reverse-direction connection already exists
    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(`Connection already exists (status: ${existing.status})`);
    }

    const me = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { goals: true, fitnessLevel: true, locationCity: true, firstName: true, lastName: true },
    });
    const theirProfile = await this.prisma.user.findUnique({
      where: { id: addresseeId },
      select: { goals: true, fitnessLevel: true, locationCity: true },
    });
    const score = me && theirProfile
      ? this.computeMatchScore(me, theirProfile).score
      : null;

    const connection = await this.prisma.connection.create({
      data: {
        requesterId,
        addresseeId,
        status: ConnectionStatus.PENDING,
        message: message ?? null,
        matchScore: score,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: addresseeId,
        type: NotificationType.FRIEND_REQUEST,
        title: 'New friend request',
        message: `${me?.firstName ?? 'Someone'} ${me?.lastName ?? ''}`.trim() + ' wants to connect',
        data: { connectionId: connection.id, requesterId },
      },
    });

    return connection;
  }

  async listIncoming(userId: string): Promise<Prisma.ConnectionGetPayload<object>[]> {
    return this.prisma.connection.findMany({
      where: { addresseeId: userId, status: ConnectionStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listOutgoing(userId: string): Promise<Prisma.ConnectionGetPayload<object>[]> {
    return this.prisma.connection.findMany({
      where: { requesterId: userId, status: ConnectionStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOwnedRequest(userId: string, requestId: string) {
    const conn = await this.prisma.connection.findUnique({ where: { id: requestId } });
    if (!conn) throw new NotFoundException('Connection request not found');
    if (conn.addresseeId !== userId) throw new ForbiddenException('Not authorized to respond to this request');
    if (conn.status !== ConnectionStatus.PENDING) {
      throw new ConflictException(`Request is already ${conn.status}`);
    }
    return conn;
  }

  async accept(userId: string, requestId: string): Promise<Prisma.ConnectionGetPayload<object>> {
    const conn = await this.getOwnedRequest(userId, requestId);
    const updated = await this.prisma.connection.update({
      where: { id: conn.id },
      data: { status: ConnectionStatus.ACCEPTED, respondedAt: new Date() },
    });

    await this.prisma.notification.create({
      data: {
        userId: conn.requesterId,
        type: NotificationType.FRIEND_ACCEPTED,
        title: 'Friend request accepted',
        message: 'Your connection request was accepted',
        data: { connectionId: conn.id, userId },
      },
    });

    return updated;
  }

  async decline(userId: string, requestId: string): Promise<void> {
    const conn = await this.getOwnedRequest(userId, requestId);
    await this.prisma.connection.update({
      where: { id: conn.id },
      data: { status: ConnectionStatus.DECLINED, respondedAt: new Date() },
    });
  }

  async listConnections(userId: string): Promise<Prisma.ConnectionGetPayload<object>[]> {
    return this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async remove(userId: string, otherUserId: string): Promise<void> {
    const conn = await this.prisma.connection.findFirst({
      where: {
        status: ConnectionStatus.ACCEPTED,
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });
    if (!conn) throw new NotFoundException('Connection not found');
    await this.prisma.connection.delete({ where: { id: conn.id } });
  }
}
