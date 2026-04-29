import { PrismaClient } from '@prisma/client';
import { securityExtension } from './src/extensions/security.extension.js';

export * from '@prisma/client';
export * from './src/extensions/security.extension.js';

/**
 * 💡 MARKET STANDARD: Extended Client
 * This client includes our security extensions by default.
 */
export const prisma = new PrismaClient().$extends(securityExtension);

/**
 * We also export a type-safe version of the extended client
 */
export type ExtendedPrismaClient = typeof prisma;
