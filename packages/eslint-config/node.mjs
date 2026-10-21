import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { baseConfig } from './base.mjs';

/**
 * ESLint config for Node.js services (NestJS).
 *
 * Adds a small set of type-aware rules that catch real async bugs
 * (unhandled promises, awaiting non-promises) without the noise of the
 * full `recommendedTypeChecked` preset. Consumers must point the parser
 * at their tsconfig via `tsconfigRootDir: import.meta.dirname`.
 */
/** @type {import("eslint").Linter.Config[]} */
export default defineConfig(baseConfig, {
  files: ['**/*.ts'],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/return-await': ['error', 'in-try-catch'],
  },
});
