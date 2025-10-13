import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    this.client.connect().catch(() => {});
  }

  async onModuleDestroy() {
    try { await this.client.quit(); } catch {}
  }

  get<T>(key: string): Promise<T | null> {
    return this.client.get(key).then(v => (v ? JSON.parse(v) : null));
  }

  set<T>(key: string, value: T, ttlSec = 60): Promise<void> {
    return this.client.set(key, JSON.stringify(value), { EX: ttlSec }).then(() => {});
  }

  del(key: string): Promise<void> {
    return this.client.del(key).then(() => {});
  }
}


