/**
 * @fileoverview Test Infrastructure Contracts
 *
 * Defines TypeScript interfaces for test configuration, test data structures,
 * and the contracts that the testing infrastructure must satisfy.
 *
 * **Key Contracts:**
 * 1. Test runner must support TypeScript without compilation step
 * 2. Test runner must support parallel execution with database isolation
 * 3. Test runner must generate coverage reports in JSON and HTML formats
 * 4. Mock services must implement same interfaces as real services
 * 5. Test database must support transaction rollback and truncation
 *
 * @module specs/003-e2e-unit-testing/contracts/test-infrastructure.ts
 */

/**
 * Configuration for Vitest unit test runner
 *
 * @interface VitestConfig
 * @example
 * ```typescript
 * const config: VitestConfig = {
 *   globals: true,
 *   environment: 'node',
 *   workers: 4,
 *   testTimeout: 10000,
 *   include: ['tests/unit/**\/*.test.ts'],
 *   coverage: {
 *     provider: 'v8',
 *     lines: 70,
 *     functions: 70,
 *     branches: 70,
 *   }
 * };
 * ```
 */
export interface VitestConfig {
  /** Run tests globally (no test() import needed) */
  globals: boolean;
  
  /** Test environment: 'node', 'jsdom', or 'happy-dom' */
  environment: 'node' | 'jsdom' | 'happy-dom';
  
  /** Number of parallel workers (default: 4) */
  workers: number;
  
  /** Timeout per test in milliseconds (default: 10000) */
  testTimeout: number;
  
  /** Glob patterns to include in test run */
  include: string[];
  
  /** Glob patterns to exclude from test run */
  exclude: string[];
  
  /** Setup files to run before tests */
  setupFiles: string[];
  
  /** Coverage configuration */
  coverage: {
    provider: 'v8' | 'c8';
    reporter: Array<'text' | 'html' | 'json' | 'json-summary'>;
    include: string[];
    exclude: string[];
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

/**
 * Configuration for Playwright E2E test runner
 *
 * @interface PlaywrightConfig
 * @example
 * ```typescript
 * const config: PlaywrightConfig = {
 *   testDir: './tests/e2e',
 *   fullyParallel: true,
 *   workers: 4,
 *   use: {
 *     baseURL: 'http://localhost:3000',
 *     trace: 'on-first-retry'
 *   }
 * };
 * ```
 */
export interface PlaywrightConfig {
  /** Directory containing E2E test files */
  testDir: string;
  
  /** Run tests in parallel (true for maximum performance) */
  fullyParallel: boolean;
  
  /** Number of parallel worker processes */
  workers: number;
  
  /** Maximum failures before stopping test run */
  maxFailures?: number;
  
  /** Number of retries on failure (e.g., 2-3 in CI) */
  retries: number;
  
  /** Timeout per test in milliseconds */
  timeout: number;
  
  /** Global timeout for all tests in milliseconds */
  globalTimeout: number;
  
  /** Browser use options */
  use: {
    baseURL: string;
    trace: 'on' | 'off' | 'on-first-retry' | 'retain-on-failure';
    screenshot: 'only-on-failure' | 'off' | 'on';
  };
  
  /** Web server configuration for test environment */
  webServer?: {
    command: string;
    url: string;
    reuseExistingServer: boolean;
  };
}

/**
 * Test setup utility contract
 *
 * @interface TestSetupUtilities
 * @example
 * ```typescript
 * const setup = await setupTestDatabase();
 * const db = setup.db;
 * // ... run tests ...
 * await setup.cleanup();
 * ```
 */
export interface TestSetupUtilities {
  /** Database instance for queries */
  db: any; // drizzle Database instance
  
  /** Raw database client for advanced operations */
  client: any; // postgres client
  
  /** Reset database to clean state */
  resetDatabase: () => Promise<void>;
  
  /** Seed test fixtures into database */
  seedFixtures: (fixtures: any[]) => Promise<void>;
  
  /** Clean up and disconnect */
  cleanup: () => Promise<void>;
}

/**
 * Mock Unlayer API contract
 *
 * @interface MockUnlayerAPI
 * @example
 * ```typescript
 * const mock = createUnlayerMock();
 * const isValid = mock.validateDesign(design);
 * const html = mock.exportHtml(design);
 * ```
 */
export interface MockUnlayerAPI {
  /**
   * Validate a design JSON structure
   * @param design The Unlayer design to validate
   * @returns Validation result with errors if invalid
   */
  validateDesign(design: unknown): {
    valid: boolean;
    errors?: string[];
  };
  
  /**
   * Export design as HTML with merge tags
   * @param design The Unlayer design to export
   * @returns HTML string with {{VARIABLE}} placeholders
   */
  exportHtml(design: unknown): string;
  
  /**
   * Parse JSON string as Unlayer design
   * @param json JSON string to parse
   * @returns Parsed design or throws error
   */
  parseDesign(json: string): any;
}

/**
 * Test fixture contract
 *
 * @interface TestFixture
 * @example
 * ```typescript
 * const fixture = loadFixture<TestTemplate>('sample-template.json');
 * db.insert(templates).values(fixture);
 * ```
 */
export interface TestFixture<T> {
  /** Fixture identifier (e.g., 'sample-template-1') */
  id: string;
  
  /** Human-readable description */
  description: string;
  
  /** The fixture data */
  data: T;
  
  /** Expected validation result */
  expectedValid?: boolean;
  
  /** Usage instructions */
  usage?: string;
}

/**
 * Test database isolation strategy
 *
 * @type DatabaseIsolationStrategy
 * @example
 * ```typescript
 * const strategy: DatabaseIsolationStrategy = 'transaction-rollback';
 * // or
 * const strategy: DatabaseIsolationStrategy = 'truncate-after';
 * ```
 */
export type DatabaseIsolationStrategy = 
  | 'transaction-rollback'  // Begin transaction before test, rollback after
  | 'truncate-after'        // Truncate all tables after test
  | 'truncate-before';      // Truncate all tables before test

/**
 * Coverage threshold configuration
 *
 * @interface CoverageThresholds
 * @example
 * ```typescript
 * const thresholds: CoverageThresholds = {
 *   lines: 70,
 *   functions: 70,
 *   branches: 70,
 *   statements: 70
 * };
 * ```
 */
export interface CoverageThresholds {
  /** Minimum line coverage percentage */
  lines: number;
  
  /** Minimum function coverage percentage */
  functions: number;
  
  /** Minimum branch coverage percentage */
  branches: number;
  
  /** Minimum statement coverage percentage */
  statements: number;
}

/**
 * API test scenario contract
 *
 * @interface APITestScenario
 * @example
 * ```typescript
 * const scenario: APITestScenario = {
 *   name: 'Create template success',
 *   method: 'POST',
 *   endpoint: '/api/templates',
 *   requestBody: { name: 'test', content: {} },
 *   expectedStatus: 201,
 *   expectedResponse: { id: 1, name: 'test' }
 * };
 * ```
 */
export interface APITestScenario {
  /** Scenario name for reporting */
  name: string;
  
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /** API endpoint path (e.g., '/api/templates') */
  endpoint: string;
  
  /** Request body (optional for GET/DELETE) */
  requestBody?: Record<string, any>;
  
  /** Query parameters */
  queryParams?: Record<string, string>;
  
  /** Expected HTTP status code */
  expectedStatus: number;
  
  /** Expected response body (partial match) */
  expectedResponse?: Record<string, any>;
  
  /** Human-readable description */
  description: string;
  
  /** Special handling or notes */
  notes?: string;
}

/**
 * E2E test user flow contract
 *
 * @interface E2EUserFlow
 * @example
 * ```typescript
 * const flow: E2EUserFlow = {
 *   name: 'Create and save template',
 *   steps: [
 *     { action: 'navigate', target: '/templates/new' },
 *     { action: 'fill', target: 'input[name="name"]', value: 'Welcome' },
 *     { action: 'click', target: 'button:has-text("Save")' },
 *     { action: 'waitFor', target: 'text=Template created' }
 *   ]
 * };
 * ```
 */
export interface E2EUserFlow {
  /** Flow name */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** Ordered steps to execute */
  steps: E2EStep[];
}

/**
 * E2E test step
 *
 * @interface E2EStep
 */
export interface E2EStep {
  /** Action type: navigate, click, fill, waitFor, etc. */
  action: 'navigate' | 'click' | 'fill' | 'waitFor' | 'screenshot' | 'verify';
  
  /** Selector or target (CSS selector, text, etc.) */
  target: string;
  
  /** Value for fill action */
  value?: string;
  
  /** Expected value for verify action */
  expected?: string;
  
  /** Timeout for waitFor action in milliseconds */
  timeout?: number;
  
  /** Description of step */
  description?: string;
}

/**
 * Test result summary contract
 *
 * @interface TestResultSummary
 * @example
 * ```typescript
 * const summary: TestResultSummary = {
 *   total: 150,
 *   passed: 145,
 *   failed: 5,
 *   duration: 45000,
 *   coverage: { lines: 75, functions: 78 }
 * };
 * ```
 */
export interface TestResultSummary {
  /** Total number of tests */
  total: number;
  
  /** Number of passed tests */
  passed: number;
  
  /** Number of failed tests */
  failed: number;
  
  /** Number of skipped tests */
  skipped: number;
  
  /** Total execution time in milliseconds */
  duration: number;
  
  /** Coverage metrics */
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  
  /** Flaky tests (passed on retry) */
  flaky: string[];
}

/**
 * Environment variables for test configuration
 *
 * @interface TestEnvironment
 * @example
 * ```typescript
 * const env: TestEnvironment = {
 *   TEST_DATABASE_URL: 'postgresql://...',
 *   TEST_API_BASE_URL: 'http://localhost:3000',
 *   CI: 'true'
 * };
 * ```
 */
export interface TestEnvironment {
  /** PostgreSQL connection string for test database */
  TEST_DATABASE_URL: string;
  
  /** Base URL for API tests */
  TEST_API_BASE_URL: string;
  
  /** Base URL for E2E tests */
  TEST_E2E_BASE_URL: string;
  
  /** Number of parallel workers */
  TEST_WORKERS?: number;
  
  /** Is running in CI environment */
  CI?: string;
  
  /** Unlayer test project ID (optional) */
  POSTCRAFT_UNLAYER_PROJECT_ID?: string;
}

/**
 * Npm script contract - available test commands
 *
 * @type NpmTestScripts
 * @description Each npm script listed should execute without configuration
 * @example
 * ```bash
 * npm test                    # Run all tests
 * npm run test:unit         # Run unit tests only
 * npm run test:e2e:headed   # Run E2E tests in headed mode
 * npm run test:coverage     # Run with coverage report
 * ```
 */
export type NpmTestScripts =
  | 'test'              // Run all tests (unit + E2E)
  | 'test:watch'        // Watch mode for development
  | 'test:unit'         // Unit tests only
  | 'test:unit:watch'   // Unit tests in watch mode
  | 'test:integration'  // Integration tests only
  | 'test:e2e'          // E2E tests (headless)
  | 'test:e2e:headed'   // E2E tests with visible browser
  | 'test:e2e:debug'    // E2E tests with inspector
  | 'test:coverage'     // All tests with coverage report
  | 'test:ci'           // CI/CD pipeline: lint + coverage + E2E
  | 'test:flaky'        // Identify flaky tests
  | 'test:perf';        // Performance benchmark tests

// Type guard for database isolation strategies
export function isDatabaseIsolationStrategy(
  value: unknown
): value is DatabaseIsolationStrategy {
  return (
    value === 'transaction-rollback' ||
    value === 'truncate-after' ||
    value === 'truncate-before'
  );
}

// Type guard for API test scenarios
export function isAPITestScenario(value: unknown): value is APITestScenario {
  const obj = value as any;
  return (
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(obj.method) &&
    typeof obj.endpoint === 'string' &&
    typeof obj.expectedStatus === 'number'
  );
}
