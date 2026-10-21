import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service.js';
import type { Env } from '../../../common/configs/env.validation.js';

/**
 * Public user shape attached to `request.user` and returned by GET /auth/me.
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET', { infer: true }),
      algorithms: ['HS256'],
    });
  }

  /**
   * VALIDATION: Load the user for a verified access token.
   * Re-checking the database means deactivated users lose access immediately.
   */
  async validate(payload: { sub: string }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const { isActive: _isActive, ...authUser } = user;
    return authUser;
  }
}
