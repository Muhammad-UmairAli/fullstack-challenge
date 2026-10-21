import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { type Env, validate } from './common/configs/env.validation.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    /**
     * ConfigModule: Environment Management
     * isGlobal: true ensures we don't need to import it in every module.
     * validate: uses our Zod schema for startup validation.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    /**
     * ThrottlerModule: Rate Limiting
     * Global per-client limit (configurable). Auth routes override with stricter limits.
     * Requires TRUST_PROXY when behind the Next.js BFF so clients are told apart.
     */
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        {
          ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
          limit: config.get('THROTTLE_LIMIT', { infer: true }),
        },
      ],
    }),

    // Global module: provides a single PrismaService (one connection pool) app-wide.
    DatabaseModule,
    AuthModule,
    HealthModule,
    ProjectsModule,
  ],
  providers: [
    // Enable rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
