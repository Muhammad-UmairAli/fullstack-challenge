import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { ZodValidationException } from 'nestjs-zod';
import type { Response } from 'express';

/**
 * 🛠️ ZOD EXCEPTION FILTER
 * Captures Zod validation errors and transforms them into a
 * frontend-friendly 'errors' object mapped by field name.
 */
@Catch(ZodError, ZodValidationException)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError | ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const zodError =
      exception instanceof ZodError
        ? exception
        : ((exception as ZodValidationException).getZodError() as ZodError);

    const errors = zodError.issues.reduce(
      (acc: Record<string, string>, issue) => {
        const path = issue.path.join('.');
        acc[path] = issue.message;
        return acc;
      },
      {} as Record<string, string>,
    );

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
}
