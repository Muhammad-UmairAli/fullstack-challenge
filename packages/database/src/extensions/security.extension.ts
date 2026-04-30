import { Prisma } from '@prisma/client';

/**
 * 🔐 Prisma Security Extension
 * Automatically removes the 'password' field from User query results
 * to prevent accidental exposure in the API response.
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
