import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from './generated/prisma/client.js';

/**
 * Fields stripped from every query result unless a query opts back in with
 * `select: { password: true }` or `omit: { password: false }`. Secure by default:
 * a forgotten `select` can never leak a password hash into an API response.
 */
export const defaultOmit = {
  user: { password: true },
} satisfies Prisma.GlobalOmitConfig;

export type DatabaseClientOptions = {
  adapter: PrismaPg;
  omit: typeof defaultOmit;
};

export type DatabaseConnectionOptions = {
  /** PostgreSQL connection string. Defaults to process.env.DATABASE_URL. */
  connectionString?: string;
  /** Fail fast instead of hanging when the database is unreachable (pg has no default). */
  connectionTimeoutMillis?: number;
  /** Maximum pooled connections per process. */
  max?: number;
};

/**
 * Constructor options for PrismaClient: the node-postgres driver adapter
 * (required since Prisma 7) plus the shared security defaults.
 */
export function createPrismaClientOptions({
  connectionString = process.env.DATABASE_URL,
  connectionTimeoutMillis = 5_000,
  max,
}: DatabaseConnectionOptions = {}): DatabaseClientOptions {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  return {
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis, max }),
    omit: defaultOmit,
  };
}

/**
 * Creates a standalone client (scripts, seeds). NestJS code should inject
 * PrismaService instead so the app shares one connection pool.
 */
export function createPrismaClient(options?: DatabaseConnectionOptions) {
  return new PrismaClient(createPrismaClientOptions(options));
}

export type DatabaseClient = PrismaClient<never, typeof defaultOmit>;

/**
 * True when a write failed on a unique constraint (Prisma error P2002).
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
