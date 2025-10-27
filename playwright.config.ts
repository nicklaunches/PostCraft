import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for PostCraft E2E tests
 *
 * Features:
 * - TypeScript support with strict type checking
 * - Parallel test execution across multiple workers
 * - Automatic retry on failure (2 retries = 3 total attempts)
 * - 30-second timeout per test
 * - Trace recording on test retry for debugging
 * - Screenshot capture on failure
 * - WebServer auto-start (localhost:3000)
 * - Chrome browser (with Chromium fallback)
 *
 * Usage:
 * - `npm run test:e2e` - Run E2E tests (headless)
 * - `npm run test:e2e:headed` - Run with visible browser
 * - `npm run test:e2e:debug` - Debug mode with inspector
 *
 * Test Execution:
 * - Tests run in parallel by default
 * - Each test gets isolated browser context
 * - Failed tests automatically retry (2 retries)
 * - Traces saved on retry in test-results/
 * - Screenshots saved on failure in test-results/
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test file patterns
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  // Parallel execution configuration
  fullyParallel: true, // All tests run in parallel
  workers: undefined, // Use default worker count (usually # of CPUs)
  retries: 2, // Retry failed tests (2 retries = 3 total attempts)
  timeout: 30 * 1000, // 30 second timeout per test

  // Global timeout for the entire test suite
  globalTimeout: 30 * 60 * 1000, // 30 minutes total

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }], // HTML report in playwright-report/
    ['list'], // Terminal output
    ['json', { outputFile: 'test-results/results.json' }], // JSON report
  ],

  // Output directories
  outputDir: 'test-results/',

  // Sharing settings between all test projects
  use: {
    // Use relative URLs (will be combined with baseURL)
    baseURL: 'http://127.0.0.1:3000',

    // Capture trace on retry for debugging
    trace: 'on-first-retry',

    // Screenshot configuration
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Keyboard and mouse settings
    actionTimeout: 5000, // 5 second timeout for individual actions
  },

  // Web server configuration - start Next.js dev server before tests
  webServer: {
    command: 'npm run dev', // Start Next.js in development mode
    url: 'http://127.0.0.1:3000', // Wait for this URL
    reuseExistingServer: !process.env.CI, // Reuse server unless in CI
    timeout: 120 * 1000, // 2 minute timeout for server startup
  },

  // Test projects (browsers to test against)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Expect configuration
  expect: {
    timeout: 5000, // 5 second timeout for assertions
  },
});
