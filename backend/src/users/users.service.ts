import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import type { DiscoverQueryDto, ListUsersQueryDto, UpdateUserDto } from './dto/users.dto';

const USER_PUBLIC_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  bio: true,
  avatarUrl: true,
  fitnessLevel: true,
  goals: true,
  locationCity: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Pick<User,
  'id' | 'email' | 'firstName' | 'lastName' | 'bio' | 'avatarUrl' |
  'fitnessLevel' | 'goals' | 'locationCity' | 'isVerified' | 'createdAt'
>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private profileCacheKey(userId: string): string {
    return `user:profile:${userId}`;
  }

  async me(userId: string): Promise<PublicUser> {
    return this.cache.getOrSet<PublicUser>(this.profileCacheKey(userId), 3600, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: USER_PUBLIC_FIELDS,
      });
      if (!user) throw new NotFoundException('User not found');
      return user;
    });
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<PublicUser> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        fitnessLevel: dto.fitnessLevel,
        goals: dto.goals,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationCity: dto.locationCity,
      },
      select: USER_PUBLIC_FIELDS,
    });
    await this.cache.del(this.profileCacheKey(userId));
    return updated;
  }

  async getById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, isActive: true, deletedAt: null },
      select: USER_PUBLIC_FIELDS,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async search(query: ListUsersQueryDto): Promise<{ items: PublicUser[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_PUBLIC_FIELDS,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async discover(
    currentUserId: string,
    query: DiscoverQueryDto,
  ): Promise<{ items: PublicUser[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      id: { not: currentUserId },
      isActive: true,
      deletedAt: null,
    };

    if (query.fitnessLevel) where.fitnessLevel = query.fitnessLevel;
    if (query.city) where.locationCity = { equals: query.city, mode: 'insensitive' };
    if (query.goals && query.goals.length > 0) where.goals = { hasSome: query.goals };

    // Exclude users we're already connected with
    const existing = await this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    const excludeIds = new Set<string>();
    for (const c of existing) {
      excludeIds.add(c.requesterId);
      excludeIds.add(c.addresseeId);
    }
    excludeIds.delete(currentUserId);
    if (excludeIds.size > 0) {
      where.id = { not: currentUserId, notIn: Array.from(excludeIds) };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_PUBLIC_FIELDS,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }
}
