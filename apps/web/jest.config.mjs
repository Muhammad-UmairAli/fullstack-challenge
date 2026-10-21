import nextJest from 'next/jest.js';

// next/jest compiles TS with Next's SWC config and loads .env files like `next dev`.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.test.ts'],
  // Replace the validated env module so tests do not depend on real configuration.
  moduleNameMapper: {
    '^(\\.{1,2}/)+env$': '<rootDir>/test/env.mock.ts',
  },
};

export default createJestConfig(config);
