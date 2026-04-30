import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { validate } from './common/configs/env.validation.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    /**
     * 💡 ConfigModule: Environment Management
     * isGlobal: true ensures we don't need to import it in every module.
     * validate: uses our Zod schema for startup validation.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    /**
     * 💡 ThrottlerModule: Rate Limiting
     * Protects the API from brute-force and DoS attacks.
     * Default: 10 requests every 60 seconds per IP.
     */
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    AuthModule,
    ProjectsModule,
    DatabaseModule.forRootAsync(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enable rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
