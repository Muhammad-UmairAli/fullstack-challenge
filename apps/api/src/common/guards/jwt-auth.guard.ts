import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Access Token Guard
 * Validates the `Authorization: Bearer <access token>` header via JwtStrategy
 * and attaches the authenticated user to `request.user`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
