import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@repo/validators';
import { headers } from 'next/headers';
import { env } from '../env';
import type { AuthTokens } from './auth-cookies';

/**
 * CORE API CLIENT (server-side only)
 * Used by Server Actions, Server Components and the proxy (BFF pattern). The browser
 * never calls the API directly because tokens live in HttpOnly cookies.
 * It handles:
 * 1. Base URL management via strict env validation
 * 2. Standardized error parsing, timeouts and non-JSON responses
 * 3. Token injection and client IP forwarding (for API rate limiting)
 */

const REQUEST_TIMEOUT_MS = 10_000;

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string>;
  status?: number;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};

export type SessionUser = { id: string; email: string; name: string | null };

/**
 * Forwards the end user's IP so the API can rate-limit per client instead of
 * per Next.js server. Only honoured by the API when TRUST_PROXY is configured.
 */
async function forwardedForHeader(): Promise<Record<string, string>> {
  try {
    const incoming = await headers();
    const forwardedFor =
      incoming.get('x-forwarded-for') ?? incoming.get('x-real-ip');
    return forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {};
  } catch {
    // Outside a request scope (e.g. during build); nothing to forward.
    return {};
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${env.API_URL}${path}`;

  const requestHeaders = new Headers(options.headers);
  if (!requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (!requestHeaders.has('X-Forwarded-For')) {
    for (const [key, value] of Object.entries(await forwardedForHeader())) {
      requestHeaders.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: requestHeaders,
      cache: 'no-store',
      signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return {
      success: false,
      data: null as unknown as T,
      message: 'Unable to reach the server. Please try again.',
    };
  }

  // Non-JSON bodies (e.g. a proxy's HTML 502 page) must not crash the caller.
  const result = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok) {
    // Standardized error parsing from our NestJS Zod filter
    return {
      success: false,
      data: null as unknown as T,
      message: result.message || 'An unexpected error occurred',
      errors: result.errors,
      status: response.status,
    };
  }

  return {
    success: true,
    data: result.data as T,
    message: result.message,
    status: response.status,
  };
}

function post<T>(path: string, body: unknown, init: RequestInit = {}) {
  return request<T>(path, {
    ...init,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export const api = {
  auth: {
    register: (data: RegisterInput) =>
      post<SessionUser>('/auth/register', data),

    login: (data: LoginInput) => post<AuthTokens>('/auth/login', data),

    refresh: (refreshToken: string, init?: RequestInit) =>
      post<AuthTokens>('/auth/refresh', { refreshToken }, init),

    logout: (refreshToken?: string) =>
      post<{ message: string }>('/auth/logout', { refreshToken }),

    forgotPassword: (data: ForgotPasswordInput) =>
      post<{ message: string }>('/auth/forgot-password', data),

    resetPassword: (data: ResetPasswordInput) =>
      post<{ message: string }>('/auth/reset-password', data),

    getMe: (token: string) =>
      request<SessionUser>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};
