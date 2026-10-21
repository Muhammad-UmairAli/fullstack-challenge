import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env automatically. Use Node's built-in loader
// (no dotenv dependency); a missing file is fine when vars come from the shell/CI.
try {
  process.loadEnvFile();
} catch {
  // No .env file present.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Read lazily-tolerant: `prisma generate` needs no database, so codegen and
    // builds work without DATABASE_URL. Commands that connect fail clearly instead.
    url: process.env.DATABASE_URL ?? '',
  },
});
