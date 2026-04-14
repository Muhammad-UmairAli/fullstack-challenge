import { Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login to the application' })
  login() {
    return this.authService.login();
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new account' })
  signup() {
    return this.authService.signup();
  }
}
