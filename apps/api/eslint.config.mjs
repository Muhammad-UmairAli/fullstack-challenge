import nodeConfig from '@repo/eslint-config/node';
import { defineConfig } from 'eslint/config';

export default defineConfig(nodeConfig, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
