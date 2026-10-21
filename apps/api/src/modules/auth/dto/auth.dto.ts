import { createZodDto } from 'nestjs-zod';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RefreshTokenSchema,
  LogoutSchema,
} from '@repo/validators';

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
export class LogoutDto extends createZodDto(LogoutSchema) {}
