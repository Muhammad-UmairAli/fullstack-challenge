import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Global Database Module
 * Imported once in AppModule; PrismaService is then injectable everywhere
 * without feature modules importing this module again.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
