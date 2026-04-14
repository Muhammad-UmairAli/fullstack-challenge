import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 💡 Standard Response Interface
 */
export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

/**
 * 💡 Transform Interceptor
 * This wraps every successful response from your controllers in a
 * consistent "Envelope". The client always knows what to expect.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data ?? null,
        message: 'Operation successful',
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
