import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'beautify-json-log/**',
      'vscode-extension/**',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
