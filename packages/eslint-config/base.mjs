import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

/**
 * Paths that are never linted, in any workspace.
 */
export const sharedIgnores = globalIgnores([
  '**/dist/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/generated/**',
  '**/next-env.d.ts',
]);

/**
 * Rules shared by every workspace. Formatting is deliberately left to
 * Prettier (`pnpm format:check`); eslint-config-prettier switches off
 * any stylistic rules that would conflict with it.
 */
export const sharedRules = {
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};

/** @type {import("eslint").Linter.Config[]} */
export const baseConfig = defineConfig(
  sharedIgnores,
  js.configs.recommended,
  tseslint.configs.recommended,
  sharedRules,
  prettierConfig,
);

export default baseConfig;
