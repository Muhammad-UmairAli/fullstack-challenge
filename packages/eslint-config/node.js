import { baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for Node.js services.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nodeConfig = [
  ...baseConfig,
  {
    rules: {
      // Node specific rules
    },
  },
];
