import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  LogoutDto,
} from './dto/auth.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.js';

/**
 * Rate limits below override the global ThrottlerGuard (registered as APP_GUARD)
 * for these routes. Applying ThrottlerGuard again here would count every request twice.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Strict rate limiting: Max 3 attempts per minute per client.
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  /**
   * POST /auth/login
   * Strict rate limiting: Max 5 attempts per minute per client.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  /**
   * POST /auth/forgot-password
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.forgotPassword(data);
  }

  /**
   * POST /auth/reset-password
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  /**
   * POST /auth/refresh
   * Rotates the refresh token: the presented token is revoked and a new pair is issued.
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() data: RefreshTokenDto) {
    return this.authService.refreshTokens(data.refreshToken);
  }

  /**
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  /**
   * POST /auth/logout
   * Revokes the given refresh token. Idempotent: always succeeds.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() data: LogoutDto) {
    return this.authService.logout(data.refreshToken);
  }
}
