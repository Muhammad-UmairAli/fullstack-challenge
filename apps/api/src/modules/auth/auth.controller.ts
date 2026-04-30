import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';
import type { Request } from 'express';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 📝 POST /auth/register
   * Strict rate limiting: Max 3 attempts per minute per IP.
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  /**
   * 🔑 POST /auth/login
   * Strict rate limiting: Max 5 attempts per minute per IP.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto) {
    const tokens = await this.authService.login(data);
    return tokens; // Returns { accessToken, refreshToken }
  }

  /**
   * 📧 POST /auth/forgot-password
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.forgotPassword(data);
  }

  /**
   * 🔄 POST /auth/reset-password
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  /**
   * 🔄 POST /auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() data: { refreshToken: string }) {
    if (!data.refreshToken)
      throw new UnauthorizedException('Refresh token missing');

    const payload = await this.authService.verifyRefreshToken(
      data.refreshToken,
    );
    return this.authService.refreshTokens(payload.sub, data.refreshToken);
  }

  /**
   * 👤 GET /auth/me
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req: Request & { user: unknown }) {
    return req.user;
  }

  /**
   * 🚪 POST /auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() data: { refreshToken?: string }) {
    return this.authService.logout(data.refreshToken);
  }
}
