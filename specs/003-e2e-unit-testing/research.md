# Research Phase: E2E Testing and Unit Testing Implementation

**Date**: October 27, 2025
**Feature Branch**: `003-e2e-unit-testing`
**Status**: Complete - All Clarifications Resolved

## Session Notes (Oct 27, 2025)

The following decisions were clarified in the specification session:
- Unit test framework: **Vitest** (selected for native TypeScript, ESM support, speed, and excellent Next.js integration)
- E2E testing framework: **Playwright** (selected for comprehensive browser automation, TypeScript support, parallel execution, auto-wait features, and trace viewer)
- Test execution: **Parallel with isolation** (tests run concurrently, each with isolated database state)
- Flaky test handling: **Automatic retry with threshold** (retry up to 2-3 times on failure, mark as flaky if still failing)
- External services: **Mock external services** (Unlayer API mocked in unit/integration tests; E2E may use test project ID with fixtures)

## Research Findings

### 1. Testing Framework Selection

**Decision**: Use **Vitest** for unit tests and **Playwright** for E2E tests

**Rationale**:
- **Vitest** offers native TypeScript support, ESM-first architecture, Vite integration, and <5 second execution times for typical projects
- **Playwright** provides enterprise-grade browser automation with automatic waiting, parallel execution, and excellent TypeScript support
- Both frameworks are industry-standard for modern JavaScript/TypeScript projects
- Vitest is significantly faster than Jest for this project due to ESM-first design and esbuild integration
- Playwright's trace viewer is invaluable for debugging E2E failures

**Alternatives Considered**:
- Jest (rejected: slower in ESM mode, more configuration overhead for Next.js App Router)
- Cypress (rejected: slower than Playwright, less parallelization capability)
- Test libraries: React Testing Library (selected for component testing, works with Vitest)

**Dependencies to Add**:
```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "playwright": "^1.50.0",
    "@playwright/test": "^1.50.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "ts-node": "^10.0.0"
  }
}
```

### 2. Test Database Setup

**Decision**: Use separate test database with automatic reset before each test run

**Rationale**:
- Isolates test data from development database
- Allows parallel test execution without race conditions
- Ensures clean state for deterministic test results
- Supports both transaction rollback and full reset strategies

**Implementation**:
- Create `TEST_DATABASE_URL` environment variable separate from `POSTCRAFT_DATABASE_URL`
- Implement test setup utilities that run migrations before test suite
- Use database transactions with rollback for test isolation (fast)
- Fallback to full reset with delete/truncate for tests that can't use transactions

**Configuration**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    }
  }
});

// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. Parallel Test Execution & Isolation

**Decision**: Run tests in parallel with database transaction rollback for isolation

**Rationale**:
- Parallel execution reduces total test time from ~2-3 minutes sequentially to ~30-45 seconds
- Vitest defaults to 4 workers per CPU core (configurable)
- Playwright natively supports parallel execution with worker processes
- Transaction rollback (rollback after each test) is faster than full database reset

**Implementation Strategy**:
- Each test gets its own database transaction
- Test setup begins transaction; teardown rolls back all changes
- Tests run in separate Node processes (Vitest workers)
- E2E tests use session isolation (separate browser profiles if needed)

**Fallback**: For tests that can't use transactions, implement database cleanup between tests:
```typescript
// tests/db-setup.ts
export async function resetDatabase() {
  // Clear all tables in dependency order
  await db.delete(templateVariables);
  await db.delete(templates);
}
```

### 4. Flaky Test Handling

**Decision**: Implement automatic retry logic (2-3 retries) with flaky test reporting

**Rationale**:
- E2E tests can fail transiently due to timing, network, or resource contention
- Automatic retries reduce false alarms while still catching real failures
- Flaky test detection helps identify unstable tests for investigation
- 2-3 retries balances reliability with time overhead

**Playwright Configuration**:
```typescript
{
  use: {
    retries: process.env.CI ? 2 : 0,  // 2 retries in CI, 0 locally
    navigationTimeout: 30000,
    actionTimeout: 10000,
  }
}
```

**Vitest Configuration**:
```typescript
{
  test: {
    retry: 0,  // Unit tests run once; they should be deterministic
  }
}
```

**Flaky Test Detection**:
- Track retry count for each test
- Report tests that fail multiple times with retries still succeeding
- Generate flaky test report at end of test run for developer awareness

### 5. External Service Mocking (Unlayer API)

**Decision**: Mock external services in unit and integration tests; optional test fixtures in E2E

**Rationale**:
- Unit/integration tests must be fast and reliable, requiring mock services
- Mocking prevents external service downtime from breaking tests
- Mocking prevents test suite from consuming production API quotas
- E2E tests can optionally use real test project with known fixtures

**Implementation**:
- Create mock factory in `tests/mocks/unlayer.ts`
- Use MSW (Mock Service Worker) or vi.mock() for HTTP mocking
- Document Unlayer API test project ID for optional E2E use
- Example mock responses in `tests/fixtures/unlayer-templates.json`

```typescript
// tests/mocks/unlayer.ts
export function mockUnlayerAPI() {
  return {
    validateDesign: (design: unknown) => ({ valid: true }),
    exportHtml: (design: unknown) => '<html>...</html>',
  };
}

// tests/setup.ts
import { vi } from 'vitest';
vi.mock('@/lib/sdk/unlayer-api', () => mockUnlayerAPI());
```

### 6. Test File Organization

**Decision**: Organize tests by type in separate directories with clear naming conventions

**Rationale**:
- Clear separation enables running specific test suites independently
- Naming conventions (`.test.ts`, `.spec.ts`) are automatically detected by test runners
- Co-locating tests with source code aids discoverability but bin/fixtures separate

**Structure**:
```
tests/
├── setup.ts                          # Global test setup
├── db-setup.ts                       # Database utilities
├── mocks/                            # Mock implementations
│   ├── unlayer.ts
│   └── fixtures/
│       ├── sample-template.json
│       └── variables.json
├── unit/                             # Unit tests
│   ├── validation.test.ts
│   ├── variable-detection.test.ts
│   ├── unlayer-validation.test.ts
│   └── api-validation.test.ts
├── integration/                      # Integration tests
│   ├── templates.integration.test.ts
│   └── template-variables.integration.test.ts
├── e2e/                              # E2E tests
│   ├── template-crud.spec.ts
│   ├── template-import.spec.ts
│   ├── template-pagination.spec.ts
│   └── fixtures/
│       └── sample-unlayer-template.json
└── api/                              # API endpoint tests
    ├── templates.api.test.ts
    └── fixtures/
        └── template-payloads.json
```

### 7. Coverage Reporting

**Decision**: Use Vitest coverage with v8 provider and generate HTML reports

**Rationale**:
- v8 is fast and accurate for coverage measurement
- HTML reports are interactive and easy to share with team
- Coverage thresholds enforce minimum coverage standards
- Text reports provide quick feedback in CI/CD

**Configuration**:
```typescript
{
  coverage: {
    provider: 'v8',
    reporter: ['text', 'text-summary', 'html', 'json'],
    include: ['lib/**/*.ts', 'app/api/**/*.ts'],
    exclude: ['**/*.test.ts', '**/node_modules/**'],
    lines: 70,      // Overall target: 70%
    functions: 70,
    branches: 70,
    statements: 70,
    skipFull: true, // Don't show 100% coverage files
  }
}
```

**Target Coverage**:
- **Utility functions** (validation, variable-detection): 80%+ (business logic)
- **API routes**: 75%+ (requires integration testing)
- **Components**: 60%+ (UI testing is lower ROI)
- **Overall**: 70% minimum

### 8. npm Scripts & CLI

**Decision**: Provide granular npm scripts for different test types and coverage modes

**Rationale**:
- Developers can run specific test suites for faster feedback
- Clear script names match developer mental models
- Coverage scripts enable coverage-driven development

**Scripts**:
```json
{
  "test": "vitest run && playwright test",
  "test:watch": "vitest",
  "test:unit": "vitest run lib/ app/api/",
  "test:unit:watch": "vitest lib/ app/api/",
  "test:integration": "vitest run tests/integration/",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:coverage": "vitest run --coverage",
  "test:ci": "npm run lint && npm run test:coverage && npm run test:e2e"
}
```

### 9. Performance Targets

**Decision**: Align with requirements from specification

**Rationale**:
- Unit tests <5 seconds: Vitest native speed plus minimal setup time
- E2E tests <2 minutes: 4 parallel workers (2-4 workers typical)
- Parallel execution cuts sequential time significantly

**Performance Optimization**:
- Vitest default 4 workers on modern hardware
- Playwright default 4 workers per available CPU cores
- Database setup amortized across tests (once per worker)
- Incremental builds with esbuild (Vitest default)

### 10. CI/CD Integration

**Decision**: Configure for GitHub Actions with matrix strategy for cross-platform testing

**Rationale**:
- Tests must pass before merge to ensure code quality
- Parallel workers in CI can be limited (CI runners have fewer resources)
- Cross-platform testing (Linux, macOS, Windows) ensures compatibility

**GitHub Actions Workflow** (example):
```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postcraft_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:coverage
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Technology Stack Summary

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| Unit Testing | Vitest | ^2.0.0 | Fast, TypeScript-first, ESM-native |
| E2E Testing | Playwright | ^1.50.0 | Enterprise-grade, parallel, trace viewer |
| Component Testing | React Testing Library | ^16.0.0 | Best practices for testing behavior not implementation |
| Coverage | v8 | Native | Fast, accurate coverage measurement |
| Mocking | vi.mock() / MSW | Built-in | Built-in Vitest mocking, optional MSW for HTTP |
| Test Database | PostgreSQL | Existing | Isolated test DB via TEST_DATABASE_URL |
| Test Environment | Node.js | 20+ | TypeScript/ESM support |

## Decision Summary

All clarifications from the specification have been resolved. The testing strategy uses:

1. **Vitest** for unit/integration tests with 4 parallel workers
2. **Playwright** for E2E tests with 4 parallel workers and automatic retries
3. **Separate test database** with transaction rollback isolation
4. **Mocked external services** in unit/integration tests
5. **Automatic flaky test retry** with 2-3 retries in CI/CD
6. **Coverage reporting** with 70% minimum thresholds
7. **npm scripts** for granular test execution
8. **GitHub Actions** for CI/CD pipeline integration

No further clarifications needed. Ready to proceed to Phase 1 design.
