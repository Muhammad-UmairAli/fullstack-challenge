import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '../../lib/auth-server';

/**
 * Signed-in users are sent home from login/register/reset pages. This checks the
 * session with the API rather than cookie presence, so a revoked or expired token
 * cannot trap a user away from the login page.
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await getServerSession()) {
    redirect('/');
  }

  return children;
}
