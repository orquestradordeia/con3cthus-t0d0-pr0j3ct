import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private client: RedisClientType | null = null;
  private ready = false;

  constructor() {
    try {
      const url = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url });
      this.client.on('ready', () => { this.ready = true; });
      this.client.on('error', () => { /* silencioso em dev */ this.ready = false; });
      // Não falhar se Redis estiver ausente
      this.client.connect().catch(() => { this.ready = false; });
    } catch {
      this.client = null;
      this.ready = false;
    }
  }

  async onModuleDestroy() {
    try { await this.client?.quit(); } catch {}
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.ready) return null;
    try {
      const v = await this.client.get(key);
      return v ? JSON.parse(v) as T : null;
    } catch { return null; }
  }

  async set<T>(key: string, value: T, ttlSec = 60): Promise<void> {
    if (!this.client || !this.ready) return;
    try { await this.client.set(key, JSON.stringify(value), { EX: ttlSec }); } catch { /* noop */ }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.ready) return;
    try { await this.client.del(key); } catch { /* noop */ }
  }
}


