import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PrismaClient,
  createPrismaClientOptions,
  type DatabaseClientOptions,
} from '@repo/database';
import type { Env } from '../common/configs/env.validation.js';

/**
 * Injectable Prisma client. User passwords are omitted from results by default
 * (see @repo/database); select them explicitly only where they are verified.
 */
@Injectable()
export class PrismaService
  extends PrismaClient<DatabaseClientOptions>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService<Env, true>) {
    super(
      createPrismaClientOptions({
        connectionString: configService.get('DATABASE_URL', { infer: true }),
      }),
    );
  }

  async onModuleInit() {
    this.logger.log('Establishing database connection...');
    await this.$connect();
    this.logger.log('Database connected successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection...');
    await this.$disconnect();
  }
}
