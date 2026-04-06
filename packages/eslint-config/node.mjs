import { baseConfig } from "./base.mjs";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
];
