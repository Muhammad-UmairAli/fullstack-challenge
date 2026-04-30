import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * 1. 🛡️ SECURITY: Middleware
   */
  app.use(helmet());
  app.use(cookieParser());

  /**
   * 2. 🌐 CORS: Configuration
   */
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  /**
   * 3. 🚀 VERSIONING: API Versioning
   */
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  /**
   * 4. 📖 DOCUMENTATION: Swagger Integration
   */
  const config = new DocumentBuilder()
    .setTitle('Fullstack Challenge API')
    .setDescription(
      'Portfolio API with Standardized Responses, Security, and Observability.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  cleanupOpenApiDoc(document);
  SwaggerModule.setup('api/docs', app, document);

  /**
   * 5. ✅ GLOBAL PIPES, FILTERS & INTERCEPTORS
   */
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter(), new ZodExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const logger = new Logger('Bootstrap');
  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  logger.log(`🚀 API is running on: http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger UI available at: http://localhost:${port}/api/docs`);
}

bootstrap();
