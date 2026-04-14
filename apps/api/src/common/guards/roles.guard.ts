import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * 💡 Role-Based Access Control Guard
 * Placeholder for future RBAC logic.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 💡 Future logic: Get roles from metadata via reflector
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    // For now, allow all requests
    if (!roles) {
      return true;
    }

    return true;
  }
}
