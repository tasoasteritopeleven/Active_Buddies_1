import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunityMemberRole, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateCommunityDto, ListCommunitiesQueryDto } from './dto/communities.dto';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCommunitiesQueryDto) {
    const where: Prisma.CommunityWhereInput = { isPublic: true };
    if (query.search && query.search.trim()) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.community.findMany({
        where,
        orderBy: { membersCount: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.community.count({ where }),
    ]);
    return { items, total };
  }

  async create(userId: string, dto: CreateCommunityDto) {
    return this.prisma.community.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        color: dto.color ?? null,
        bannerUrl: dto.bannerUrl ?? null,
        isPublic: dto.isPublic ?? true,
        createdById: userId,
        membersCount: 1,
        members: { create: { userId, role: CommunityMemberRole.ADMIN } },
      },
    });
  }

  async getById(id: string) {
    const c = await this.prisma.community.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    });
    if (!c) throw new NotFoundException('Community not found');
    return c;
  }

  async join(userId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');
    if (!community.isPublic) throw new ForbiddenException('Community is private');

    try {
      const [member] = await this.prisma.$transaction([
        this.prisma.communityMember.create({
          data: { communityId, userId, role: CommunityMemberRole.MEMBER },
        }),
        this.prisma.community.update({
          where: { id: communityId },
          data: { membersCount: { increment: 1 } },
        }),
      ]);
      return member;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Already a member');
      }
      throw err;
    }
  }

  async leave(userId: string, communityId: string): Promise<void> {
    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!existing) throw new NotFoundException('Not a member');
    await this.prisma.$transaction([
      this.prisma.communityMember.delete({ where: { id: existing.id } }),
      this.prisma.community.update({
        where: { id: communityId },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);
  }

  async members(communityId: string) {
    return this.prisma.communityMember.findMany({
      where: { communityId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
