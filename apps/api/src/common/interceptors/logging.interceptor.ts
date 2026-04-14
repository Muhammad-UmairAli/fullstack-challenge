import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 💡 Logging Interceptor
 * This interceptor tracks the lifecycle of every request.
 * It logs the method, path, status, and exactly how many milliseconds it took.
 * Essential for monitoring and performance auditing.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const delay = Date.now() - now;

        this.logger.log(`[${method}] ${url} - ${statusCode} (${delay}ms)`);
      }),
    );
  }
}
