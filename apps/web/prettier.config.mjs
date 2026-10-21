import { fileURLToPath } from 'node:url';
import baseConfig from '@repo/prettier-config' with { type: 'json' };

/** @type {import('prettier').Config} */
const config = {
  ...baseConfig,
  // Resolved from this file so formatting works from the repo root too
  // (Prettier otherwise resolves plugins from the current working directory).
  plugins: [fileURLToPath(import.meta.resolve('prettier-plugin-tailwindcss'))],
  // Tailwind v4: lets the plugin see theme utilities defined in CSS.
  tailwindStylesheet: './app/globals.css',
};

export default config;
