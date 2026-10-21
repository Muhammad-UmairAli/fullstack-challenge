import { z } from 'zod';

/**
 * AUTH SCHEMAS
 * Password policy and credential validation shared by API and web.
 */

// Upper bound keeps argon2 hashing cost predictable for hostile input.
const PASSWORD_MAX_LENGTH = 128;

const email = z
  .email({ error: 'Invalid email address' })
  .max(254, { error: 'Email address is too long' });

const strongPassword = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters long' })
  .max(PASSWORD_MAX_LENGTH, {
    error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`,
  })
  .regex(/[A-Z]/, {
    error: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
    error: 'Password must contain at least one lowercase letter',
  })
  .regex(/[0-9]/, { error: 'Password must contain at least one number' });

export const RegisterSchema = z.object({
  email,
  password: strongPassword,
  name: z
    .string()
    .trim()
    .min(2, { error: 'Name must be at least 2 characters long' })
    .max(100, { error: 'Name must be at most 100 characters long' })
    .optional(),
});

export const LoginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, { error: 'Password is required' })
    .max(PASSWORD_MAX_LENGTH, { error: 'Invalid credentials' }),
});

export const ForgotPasswordSchema = z.object({
  email,
});

export const ResetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, { error: 'Token is required' })
    .max(256, { error: 'Invalid token' }),
  password: strongPassword,
});

export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, { error: 'Refresh token is required' })
    .max(2048, { error: 'Invalid refresh token' }),
});

export const LogoutSchema = RefreshTokenSchema.partial();

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
