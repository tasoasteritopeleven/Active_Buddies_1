import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client!: Redis;
  private isReady = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<string>('REDIS_PORT', '6379')),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      db: Number(this.config.get<string>('REDIS_DB', '0')),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('✓ Redis ready');
    });
    this.client.on('end', () => {
      this.isReady = false;
      this.logger.warn('Redis connection closed');
    });

    try {
      await this.client.connect();
    } catch (err) {
      this.logger.error(`Failed to connect to Redis: ${(err as Error).message}`);
      // Do not throw — the app should still boot for local dev without Redis
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isConnected(): boolean {
    return this.isReady;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady) return null;
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isReady) return;
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isReady || keys.length === 0) return;
    await this.client.del(...keys);
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isReady) return;
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const pipeline = this.client.pipeline();
    for await (const keys of stream) {
      const keyList = keys as string[];
      if (keyList.length > 0) pipeline.del(...keyList);
    }
    await pipeline.exec();
  }

  async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await loader();
    await this.set<T>(key, fresh, ttlSeconds);
    return fresh;
  }
}
