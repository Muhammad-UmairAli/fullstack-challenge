import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { type Observable } from 'rxjs';

/**
 * 💡 Access Token Guard
 * This is a placeholder for your JWT Authentication logic.
 */
@Injectable()
export class AtGuard implements CanActivate {
  canActivate(
    _context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
