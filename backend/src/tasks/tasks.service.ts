import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly mqtt: MqttService,
  ) {}

  async list(userId: string, filters?: { status?: 'PENDING' | 'DONE'; from?: Date; to?: Date }) {
    const key = `tasks:${userId}:${filters?.status ?? 'ALL'}:${filters?.from?.toISOString() ?? 'NONE'}:${filters?.to?.toISOString() ?? 'NONE'}`
    const cached = await this.cache.get<any[]>(key)
    if (cached) return cached
    const where: any = { userId }
    if (filters?.status) where.status = filters.status
    if (filters?.from || filters?.to) {
      where.createdAt = {}
      if (filters.from) where.createdAt.gte = filters.from
      if (filters.to) where.createdAt.lte = filters.to
    }
    const data = await this.prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    await this.cache.set(key, data, 30)
    return data
  }

  async create(userId: string, data: { title: string; description?: string; dueDate?: Date }) {
    const task = await this.prisma.task.create({ data: { ...data, userId } })
    await this.invalidate(userId)
    this.mqtt.publish(`users/${userId}/tasks/created`, { id: task.id, title: task.title })
    return task
  }

  async update(userId: string, id: string, data: any) {
    const task = await this.prisma.task.update({ where: { id }, data: { ...data, userId } })
    await this.invalidate(userId)
    return task
  }

  async remove(userId: string, id: string) {
    const task = await this.prisma.task.delete({ where: { id } })
    await this.invalidate(userId)
    return task
  }

  private async invalidate(userId: string) {
    await Promise.all([
      this.cache.del(`tasks:${userId}:ALL`),
      this.cache.del(`tasks:${userId}:PENDING`),
      this.cache.del(`tasks:${userId}:DONE`),
    ])
  }
}


