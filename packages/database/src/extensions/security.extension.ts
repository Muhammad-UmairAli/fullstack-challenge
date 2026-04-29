import { Prisma } from '@prisma/client';

/**
 * 🔐 MARKET STANDARD: Automated Security Scrubber
 * This extension automatically removes the 'password' field from any
 * result that contains a User. This prevents accidental data leaks.
 *
 * NOTE: If you EXPLICITLY need the password (e.g., during login),
 * you must use a raw query or a separate client.
 */
export const securityExtension = Prisma.defineExtension({
  name: 'securityExtension',
  result: {
    user: {
      password: {
        needs: { password: true },
        compute() {
          return undefined;
        },
      },
    },
  },
});
