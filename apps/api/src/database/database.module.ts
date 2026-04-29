import { type DynamicModule, Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * 💡 MARKET STANDARD: Global Database Module
 * While we usually avoid @Global(), the Database is the backbone of the app.
 * Making it Global ensures that PrismaService is available everywhere
 * without repetitive imports, while still keeping connection logic encapsulated.
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
