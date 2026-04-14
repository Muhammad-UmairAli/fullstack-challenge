import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * 💡 Global Exception Filter
 * This catches EVERY error in the application and formats it into a
 * predictable JSON structure.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>).message ||
          (exceptionResponse as Record<string, unknown>).error
        : exceptionResponse;

    const errorResponse = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      error:
        status === 500
          ? 'Internal Server Error'
          : exception instanceof Error
            ? exception.name
            : 'Error',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} Error`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} Client Error: ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
