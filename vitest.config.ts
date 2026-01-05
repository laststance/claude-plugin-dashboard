import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test file patterns
    include: ['source/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Environment settings
    environment: 'node',
    globals: true,

    // Execution settings
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter settings
    reporters: ['default'],

    // Coverage settings
    coverage: {
      provider: 'v8',
      enabled: false,
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['source/**/*.{ts,tsx}'],
      exclude: [
        'source/**/*.{test,spec}.{ts,tsx}',
        'source/cli.tsx', // Entry point
        'source/types/index.ts', // Type definitions only (no runtime code)
      ],
    },

    // Clean mocks between tests
    clearMocks: true,
    restoreMocks: true,

    // Sequence settings
    sequence: {
      shuffle: false,
    },
  },
})
