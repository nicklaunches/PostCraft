import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Vitest configuration for PostCraft unit and integration tests
 *
 * Features:
 * - TypeScript support with strict module resolution
 * - ESM module format for modern JavaScript
 * - Node.js environment (not DOM)
 * - 4 parallel workers for fast test execution
 * - 10-second timeout per test
 * - Coverage reporting (v8 backend)
 * - Coverage thresholds: 80% utilities, 70% overall
 * - Includes global test setup for database initialization
 *
 * Usage:
 * - `npm run test` - Run all tests
 * - `npm run test:watch` - Watch mode
 * - `npm run test:unit` - Unit tests only
 * - `npm run test:coverage` - With coverage report
 *
 * Coverage Report Output:
 * - Terminal text summary
 * - HTML report: coverage/index.html
 * - JSON: coverage/coverage-final.json
 *
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  test: {
    // Global test environment configuration
    globals: true, // Use global test functions (describe, it, beforeEach, etc.)
    environment: 'node', // Node.js environment (not jsdom/happy-dom)

    // Test execution - parallel workers for fast execution
    pool: 'threads', // Use worker threads
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },
    maxWorkers: 4, // Parallel execution with 4 workers
    minWorkers: 1, // Minimum workers
    testTimeout: 10000, // 10 second timeout per test
    hookTimeout: 10000, // 10 second timeout for hooks (beforeEach, afterEach, etc.)

    // Test file discovery
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/api/**/*.test.ts',
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '.next',
      '.idea',
      '.vscode',
    ],

    // Global setup and teardown
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      // Use v8 backend for coverage (faster, more accurate)
      provider: 'v8',

      // Report formats
      reporter: ['text', 'html', 'json'],

      // Coverage output directory
      reportsDirectory: './coverage',

      // Files to include in coverage (utilities and API routes)
      include: [
        'lib/**/*.ts',
        'app/api/**/*.ts',
      ],

      // Files to exclude from coverage (tests, node_modules, etc.)
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.next/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/.next/**',
      ],

      // Coverage thresholds - fail if below these percentages
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },

  // Path alias resolution (match tsconfig.json)
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
