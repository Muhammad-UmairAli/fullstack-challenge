import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@repo/validators';
import { env } from '../env';

/**
 * 🌐 CORE API CLIENT
 * This is the single source of truth for all backend communication.
 * It handles:
 * 1. Base URL management (Server vs Client side) via strict env validation
 * 2. Standardized error parsing
 * 3. Token injection (for server actions)
 */

const getApiBaseUrl = () =>
  typeof window === 'undefined' ? env.API_URL : env.NEXT_PUBLIC_API_URL;

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string>;
};

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${getApiBaseUrl()}${path}`;

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const result = (await response.json()) as {
        success?: boolean;
        data?: T;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        // Standardized error parsing from our NestJS Zod filter
        return {
          success: false,
          data: null as unknown as T,
          message: result.message || 'An unexpected error occurred',
          errors: result.errors,
        };
      }

      return {
        success: true,
        data: result.data as T,
        message: result.message,
      };
    } catch {
      return {
        success: false,
        data: null as unknown as T,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Auth Endpoints
  auth = {
    register: (data: RegisterInput) =>
      this.request<unknown>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: LoginInput) =>
      this.request<{ accessToken: string; refreshToken?: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),

    refresh: (refreshToken: string) =>
      this.request<{ accessToken: string; refreshToken?: string }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        },
      ),

    logout: (refreshToken?: string) =>
      this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    forgotPassword: (data: ForgotPasswordInput) =>
      this.request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    resetPassword: (data: ResetPasswordInput) =>
      this.request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMe: (token: string) =>
      this.request<unknown>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
  };
}

export const api = new ApiClient();
