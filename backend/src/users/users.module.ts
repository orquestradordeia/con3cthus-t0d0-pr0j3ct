import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, CacheService],
  exports: [UsersService],
})
export class UsersModule {}


