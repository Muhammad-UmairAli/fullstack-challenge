import { type DynamicModule, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Module({})
export class DatabaseModule {
  static forRootAsync(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [PrismaService],
      exports: [PrismaService],
    };
  }
}
