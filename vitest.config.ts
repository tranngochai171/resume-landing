import { defineConfig } from 'vitest/config';

// Logic-only unit tests (node env, no jsdom). Scoped to *.test.ts colocated with source.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
