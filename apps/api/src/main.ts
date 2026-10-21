import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { parseTrustProxy, type Env } from './common/configs/env.validation.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService<Env, true>>(ConfigService);
  const logger = new Logger('Bootstrap');

  /**
   * 1. SECURITY: Middleware
   */
  app.use(helmet());

  // Trust only the configured proxies so req.ip (and thus rate limiting) reflects the real client.
  app.set(
    'trust proxy',
    parseTrustProxy(configService.get('TRUST_PROXY', { infer: true })),
  );

  /**
   * 2. CORS: Configuration
   */
  app.enableCors({
    origin: configService.get('FRONTEND_URL', { infer: true }),
    credentials: true,
  });

  /**
   * 3. VERSIONING, PIPES, FILTERS & INTERCEPTORS
   * Shared with the e2e tests so they exercise the same request pipeline.
   */
  configureApp(app);

  /**
   * 4. DOCUMENTATION: Swagger (disabled in production unless explicitly enabled)
   */
  const nodeEnv = configService.get('NODE_ENV', { infer: true });
  const swaggerEnabled =
    configService.get('SWAGGER_ENABLED', { infer: true }) ??
    nodeEnv !== 'production';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Fullstack Challenge API')
      .setDescription(
        'Portfolio API with Standardized Responses, Security, and Observability.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));
  }

  // Lets Nest run onModuleDestroy hooks (e.g. closing DB pools) on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);

  logger.log(`API is running on: http://localhost:${port}/api/v1`);
  if (swaggerEnabled) {
    logger.log(`Swagger UI available at: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error(
    'Failed to start API',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
