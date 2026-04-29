import { cookies } from 'next/headers';
import { api } from './api';

/**
 * 🔒 SERVER-SIDE AUTH UTILITY
 * This utility allows Server Components to securely fetch the current session
 * without exposing tokens to the client.
 */

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const result = await api.auth.getMe(token);
    if (result.success && result.data) {
      // Cast the unknown data to the expected session user type
      return result.data as { id: string; email: string; name?: string };
    }
    return null;
  } catch {
    return null;
  }
}
