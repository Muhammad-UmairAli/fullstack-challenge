import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Health checks for load balancers and container orchestrators.
 * - GET /api/v1/health       liveness: the process is up
 * - GET /api/v1/health/ready readiness: the database is reachable
 */
@ApiTags('System')
@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check (verifies database connectivity)' })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch (error) {
      this.logger.error(
        'Readiness check failed: database unreachable',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
