import { type DynamicModule, Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * 💡 Global Database Module
 * Provides the PrismaService globally for database access.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {
  static forRootAsync(): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [PrismaService],
      exports: [PrismaService],
    };
  }
}
