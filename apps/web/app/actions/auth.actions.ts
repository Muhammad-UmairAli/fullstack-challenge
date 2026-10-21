'use server';

import { cookies } from 'next/headers';
import type { z } from 'zod';
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@repo/validators';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@repo/validators';
import { api, type ApiResponse } from '../../lib/api';
import {
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../../lib/auth-cookies';

/**
 * SERVER ACTIONS: Secure Authentication
 * These actions run ONLY on the server, keeping sensitive logic
 * and HttpOnly cookies away from the client-side XSS risks.
 *
 * Server Actions are public HTTP endpoints, so every input is re-validated here
 * even though the forms validate client-side.
 */

export type ActionResponse = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

function invalidInput(error: z.ZodError): ActionResponse {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return { success: false, message: 'Validation failed', errors };
}

// Strips API payloads (e.g. user records) so only the action contract reaches the client.
function toActionResponse(result: ApiResponse<unknown>): ActionResponse {
  return {
    success: result.success,
    message: result.message,
    errors: result.errors,
  };
}

export async function loginAction(
  data: LoginInput,
  options?: { rememberMe?: boolean } | null,
): Promise<ActionResponse> {
  const parsed = LoginSchema.safeParse(data);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await api.auth.login(parsed.data);

  if (result.success && result.data) {
    // BFF (Backend-For-Frontend) cookie management: tokens never reach client JS.
    // Client-controlled input: only an explicit `false` opts out of persistence.
    setAuthCookies(await cookies(), result.data, {
      persistent: options?.rememberMe !== false,
    });
    return { success: true };
  }

  return toActionResponse(result);
}

export async function registerAction(
  data: RegisterInput,
): Promise<ActionResponse> {
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) return invalidInput(parsed.error);

  return toActionResponse(await api.auth.register(parsed.data));
}

export async function logoutAction(): Promise<ActionResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  // Clear cookies even if the API call fails; the session must end locally regardless.
  await api.auth.logout(refreshToken);
  clearAuthCookies(cookieStore);
  return { success: true };
}

export async function forgotPasswordAction(
  data: ForgotPasswordInput,
): Promise<ActionResponse> {
  const parsed = ForgotPasswordSchema.safeParse(data);
  if (!parsed.success) return invalidInput(parsed.error);

  return toActionResponse(await api.auth.forgotPassword(parsed.data));
}

export async function resetPasswordAction(
  data: ResetPasswordInput,
): Promise<ActionResponse> {
  const parsed = ResetPasswordSchema.safeParse(data);
  if (!parsed.success) return invalidInput(parsed.error);

  return toActionResponse(await api.auth.resetPassword(parsed.data));
}
