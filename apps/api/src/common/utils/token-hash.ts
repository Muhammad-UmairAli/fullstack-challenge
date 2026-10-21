import { createHash } from 'node:crypto';

/**
 * Hashes an opaque token (refresh token, password reset token) for storage.
 * The tokens are high-entropy random values, so a fast unsalted SHA-256 is
 * sufficient; a slow password hash would only add latency to every lookup.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
