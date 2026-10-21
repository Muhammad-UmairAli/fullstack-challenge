import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier/flat';
import { sharedIgnores, sharedRules } from './base.mjs';

/**
 * ESLint config for Next.js apps. eslint-config-next 16 ships native flat
 * configs (including typescript-eslint), so no FlatCompat shim is needed.
 */
/** @type {import("eslint").Linter.Config[]} */
export default defineConfig(
  sharedIgnores,
  nextVitals,
  nextTs,
  sharedRules,
  {
    // React Compiler rules new in eslint-plugin-react-hooks 7 (eslint-config-next 16).
    // Warn while existing components (mount flags, random values in useMemo) are
    // migrated; flip back to "error" once `pnpm lint` reports no warnings.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  prettierConfig,
);
