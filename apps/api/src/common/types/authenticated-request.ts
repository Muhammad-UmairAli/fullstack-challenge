import type { Request } from 'express';
import type { AuthUser } from '../../modules/auth/strategies/jwt.strategy.js';

/**
 * Express request after JwtAuthGuard has run.
 */
export type AuthenticatedRequest = Request & { user: AuthUser };
