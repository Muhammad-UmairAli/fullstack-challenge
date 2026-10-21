import { type INestApplication, VersioningType } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

/**
 * Applies the request pipeline shared by main.ts and the e2e tests:
 * URI versioning under /api/v1, Zod validation, error envelopes and logging.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ZodValidationPipe());
  // Order matters: the last filter registered is tried first, so Zod errors win over the catch-all.
  app.useGlobalFilters(new GlobalExceptionFilter(), new ZodExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  return app;
}
