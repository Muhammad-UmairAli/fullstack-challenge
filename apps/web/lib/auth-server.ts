import { cache } from 'react';
import { cookies } from 'next/headers';
import { api, type SessionUser } from './api';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies';

/**
 * SERVER-SIDE AUTH UTILITY
 * This utility allows Server Components to securely fetch the current session
 * without exposing tokens to the client.
 */
// cache(): the root layout and auth layout share one /auth/me call per request.
export const getServerSession = cache(
  async function getServerSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const result = await api.auth.getMe(token);
    if (!result.success || !result.data) {
      return null;
    }

    const { id, email, name } = result.data;
    return { id, email, name };
  },
);
