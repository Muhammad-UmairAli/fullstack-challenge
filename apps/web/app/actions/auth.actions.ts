'use server';

import { cookies } from 'next/headers';
import { api } from '../../lib/api';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@repo/validators';

/**
 * 🔒 SERVER ACTIONS: Secure Authentication
 * These actions run ONLY on the server, keeping sensitive logic
 * and HttpOnly cookies away from the client-side XSS risks.
 */

export async function loginAction(data: LoginInput) {
  const result = await api.auth.login(data);

  if (result.success && result.data) {
    const cookieStore = await cookies();

    // 🛡️ MARKET STANDARD: BFF (Backend-For-Frontend) Cookie Management
    // Next.js explicitly controls the session by setting both tokens.

    // 1. Short-lived Access Token (e.g., 15m)
    cookieStore.set('access_token', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    // 2. Long-lived Refresh Token (e.g., 7d)
    if (result.data.refreshToken) {
      cookieStore.set('refresh_token', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Strict to prevent CSRF on refresh
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    return { success: true };
  }

  return {
    success: false,
    message: result.message,
    ...(result.errors ? { errors: result.errors } : {}),
  };
}

export async function registerAction(data: RegisterInput) {
  const result = await api.auth.register(data);
  return result;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  await api.auth.logout(refreshToken);
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  return { success: true };
}

export async function forgotPasswordAction(data: ForgotPasswordInput) {
  const result = await api.auth.forgotPassword(data);
  return result;
}

export async function resetPasswordAction(data: ResetPasswordInput) {
  const result = await api.auth.resetPassword(data);
  return result;
}
