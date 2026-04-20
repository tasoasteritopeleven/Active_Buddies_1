import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import type { AuthTokensDto, LoginDto, RegisterDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---- Password helpers ---------------------------------------------------

  private async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MB, OWASP recommendation
      timeCost: 2,
      parallelism: 1,
    });
  }

  private async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  // ---- Token helpers ------------------------------------------------------

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  private refreshTokenExpiryDate(): Date {
    const expiresIn = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
    if (!match) {
      throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN format: ${expiresIn}`);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multiplier: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multiplier[unit]);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokensDto> {
    const accessToken = await this.signAccessToken({ sub: userId, email, role });
    const refreshToken = this.generateRefreshToken();
    const expiresAt = this.refreshTokenExpiryDate();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        userAgent: meta?.userAgent?.slice(0, 255),
        ipAddress: meta?.ipAddress?.slice(0, 45),
      },
    });

    return {
      id: userId,
      email,
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
      refreshTokenExpiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    };
  }

  // ---- Public API ---------------------------------------------------------

  async register(dto: RegisterDto, meta?: { userAgent?: string; ipAddress?: string }): Promise<AuthTokensDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
      },
      select: { id: true, email: true, role: true },
    });

    return this.issueTokens(user.id, user.email, user.role, meta);
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ipAddress?: string }): Promise<AuthTokensDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, email: true, role: true, passwordHash: true, isActive: true, deletedAt: true },
    });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.verifyPassword(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email, user.role, meta);
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ipAddress?: string }): Promise<AuthTokensDto> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true, deletedAt: true } },
      },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const { user } = stored;
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateUserById(userId: string): Promise<{ id: string; email: string; role: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });
    if (!user || !user.isActive || user.deletedAt) return null;
    return { id: user.id, email: user.email, role: user.role };
  }
}
