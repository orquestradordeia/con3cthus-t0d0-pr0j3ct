import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}

  async getProfile(userId: string) {
    const cacheKey = `user:${userId}`
    const cached = await this.cache.get<any>(cacheKey)
    if (cached) return cached
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, createdAt: true } })
    if (user) await this.cache.set(cacheKey, user, 60)
    return user
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await this.prisma.user.update({ where: { id: userId }, data })
    await this.cache.del(`user:${userId}`)
    return user
  }
}


