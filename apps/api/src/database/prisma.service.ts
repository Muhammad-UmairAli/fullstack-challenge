import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, securityExtension } from '@repo/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * 🔐 Security Extension
   * Applies the shared security extension for query filtering and safety.
   */
  public readonly client = this.$extends(securityExtension);

  constructor() {
    super();
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
