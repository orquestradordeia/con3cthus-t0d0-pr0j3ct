import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { MqttService } from '../mqtt/mqtt.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, PrismaService, CacheService, MqttService],
})
export class TasksModule {}


