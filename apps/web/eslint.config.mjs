import nextConfig from '@repo/eslint-config/nextjs';
import { defineConfig } from 'eslint/config';

export default defineConfig(nextConfig, {
  // Lets Next's rules find the app when ESLint runs from the repo root (lint-staged).
  settings: { next: { rootDir: import.meta.dirname } },
});
