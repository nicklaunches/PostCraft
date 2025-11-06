# Quickstart: E2E Testing and Unit Testing Implementation

**Feature Branch**: `003-e2e-unit-testing`
**Last Updated**: October 27, 2025

## Quick Reference

| Task | Command | Time |
|------|---------|------|
| Run all tests | `npm test` | ~60 seconds |
| Run unit tests only | `npm run test:unit` | ~5 seconds |
| Run E2E tests | `npm run test:e2e` | ~30 seconds |
| Generate coverage | `npm run test:coverage` | ~60 seconds |
| Watch mode (development) | `npm run test:watch` | Continuous |
| Debug E2E tests | `npm run test:e2e:debug` | Interactive |

## Prerequisites

### 1. Environment Setup

```bash
# Create .env.test file in project root
cp .env.sample .env.test

# Edit .env.test with test database connection
# IMPORTANT: Use separate TEST_DATABASE_URL, not POSTCRAFT_DATABASE_URL
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/postcraft_test
```

### 2. Test Database

```bash
# Create test database (PostgreSQL)
psql -U postgres -c "CREATE DATABASE postcraft_test;"

# Or use Docker Compose
docker-compose -f docker-compose.test.yml up -d

# The test setup automatically runs migrations
```

### 3. Install Dependencies

```bash
npm install --save-dev \
  vitest@^2.0.0 \
  @vitest/ui@^2.0.0 \
  @vitest/coverage-v8@^2.0.0 \
  playwright@^1.50.0 \
  @playwright/test@^1.50.0 \
  @testing-library/react@^16.0.0 \
  @testing-library/jest-dom@^6.0.0
```

## Project Structure

```
tests/                          # Test suite root
├── setup.ts                    # Global setup (database, mocks)
├── db-setup.ts                 # Database utilities
├── mocks/                      # Mock implementations
│   ├── unlayer.ts             # Unlayer API mock
│   └── fixtures/
│       ├── sample-template.json
│       └── variables.json
├── unit/                       # Unit tests
│   ├── validation.test.ts
│   ├── variable-detection.test.ts
│   ├── unlayer-validation.test.ts
│   └── api-validation.test.ts
├── integration/                # Integration tests
│   ├── templates.integration.test.ts
│   └── template-variables.integration.test.ts
├── e2e/                        # E2E tests (Playwright)
│   ├── template-crud.spec.ts
│   ├── template-import.spec.ts
│   └── template-pagination.spec.ts
└── api/                        # API tests
    └── templates.api.test.ts

vitest.config.ts               # Vitest configuration
playwright.config.ts           # Playwright configuration
.env.test                      # Test environment variables
```

## Running Tests

### 1. Unit Tests (Fastest)

```bash
# Run all unit tests
npm run test:unit

# Watch mode for development (auto-rerun on changes)
npm run test:watch

# Show test UI dashboard
npm run test:ui

# Generate coverage
npm run test:coverage
```

**Output**:
- Pass/fail status with assertion details
- Failed test names and error messages
- Coverage summary: lines, functions, branches
- ~5 seconds total execution time

### 2. E2E Tests (Full Workflow)

```bash
# Run E2E tests (headless, fast)
npm run test:e2e

# Run with visible browser (debug mode)
npm run test:e2e:headed

# Interactive debugger with DevTools
npm run test:e2e:debug
```

**Output**:
- Browser automation traces
- Screenshots on failure (saved to `playwright-report/`)
- Test execution video (optional)
- Pass/fail for each user flow
- ~30 seconds total execution time

### 3. Integration Tests

```bash
# Run integration tests only
npm run test:integration

# Integration tests verify database operations with real Drizzle ORM
```

### 4. API Tests

```bash
# API tests run as part of npm test
# Or run specific API endpoint tests
npm run test:unit -- tests/api/

# Verify endpoints with coverage
npm run test:coverage -- tests/api/
```

### 5. All Tests (CI/CD)

```bash
# Run complete test suite (lint + unit + integration + E2E + coverage)
npm run test:ci

# Expected output:
# ✓ Lint checks passed
# ✓ 120+ unit tests passed (~5s)
# ✓ 15+ integration tests passed (~20s)
# ✓ 20+ API tests passed (~10s)
# ✓ 5+ E2E flows passed (~30s)
# ✓ Coverage: 72% lines, 75% functions, 70% branches
# Total: ~65 seconds
```

## Common Workflows

### 1. Write a Unit Test (TDD)

```typescript
// tests/unit/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/utils/my-feature';

describe('myFunction', () => {
  it('should return correct value for valid input', () => {
    const result = myFunction({ name: 'Test' });
    expect(result).toBe('Test processed');
  });

  it('should throw error for invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

**Run test**:
```bash
npm run test:watch
# Test immediately runs and watches for changes
```

### 2. Write an E2E Test

```typescript
// tests/e2e/my-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Template Import', () => {
  test('should import JSON template', async ({ page }) => {
    // Navigate to import page
    await page.goto('/templates/new');
    
    // Upload file
    await page.locator('input[type="file"]').setInputFiles('examples/sample-template.json');
    
    // Wait for editor to load
    await page.waitForSelector('[data-testid="editor"]');
    
    // Verify design loaded
    const editor = await page.locator('[data-testid="editor"]');
    await expect(editor).toBeVisible();
  });
});
```

**Run test**:
```bash
npm run test:e2e:headed
# Browser opens and you see the flow execute
```

### 3. Debug a Failing Test

```bash
# Get detailed error output
npm run test:unit -- --reporter=verbose

# For E2E tests, view last traces
npm run test:e2e
# Then open: playwright-report/index.html
```

### 4. Measure Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# Open report
open coverage/index.html

# View as text in terminal
npm run test:coverage -- --reporter=text-summary
```

**Coverage Report Shows**:
- Which files are tested
- Which lines executed
- Which branches covered
- Untested code highlighted in red

### 5. Run Tests in CI/CD

```bash
# GitHub Actions will run:
npm run test:ci

# Which executes:
# 1. Linting checks
# 2. Unit tests with coverage
# 3. E2E tests (sequential, 1 worker in CI)
# 4. Generates HTML reports
# 5. Uploads artifacts on failure
```

## Configuration Files

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // No need to import describe(), it(), etc.
    environment: 'node',     // Use Node.js environment
    workers: 4,              // 4 parallel workers
    testTimeout: 10000,      // 10 second timeout per test
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
    exclude: [
      'tests/e2e/**',        // E2E tests run via Playwright
    ],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,
  retries: process.env.CI ? 2 : 0,  // Retry in CI
  timeout: 30 * 1000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### .env.test

```bash
# Test Database (separate from development)
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/postcraft_test

# Test API URLs
TEST_API_BASE_URL=http://localhost:3000
TEST_E2E_BASE_URL=http://localhost:3000

# Number of parallel workers
TEST_WORKERS=4

# CI detection
CI=false
```

## Database Setup for Tests

### First Time Setup

```bash
# 1. Create test database
createdb postcraft_test

# 2. Run migrations (setup.ts does this automatically)
npm run test:unit -- --reporter=verbose

# 3. Verify database created
psql -U postgres -d postcraft_test -c "\dt"
```

### Reset Test Database

```bash
# Option 1: Full reset (drop and recreate)
dropdb postcraft_test
createdb postcraft_test
npm run test:unit

# Option 2: Truncate tables (faster)
npm run test -- --reporter=verbose

# Tests automatically reset database between runs
```

## Troubleshooting

### Test Database Connection Failed

```bash
# Check TEST_DATABASE_URL in .env.test
cat .env.test | grep TEST_DATABASE_URL

# Test PostgreSQL connection
psql -U postgres -d postcraft_test -c "SELECT NOW();"

# If not exists, create:
createdb postcraft_test
```

### E2E Tests Fail with Timeout

```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000  // Increase to 60 seconds

# Or run in headed mode to debug
npm run test:e2e:headed

# Check browser DevTools for stuck elements
```

### Coverage Below Threshold

```bash
# View uncovered files
npm run test:coverage

# Open HTML report
open coverage/index.html

# Identify untested code (shown in red)
# Add tests for critical untested paths
```

### Flaky Tests (Intermittent Failures)

```bash
# Playwright automatically retries on failure
# Check for timing issues:
- await page.waitForLoadState('networkidle')
- Add explicit waits: await page.waitForSelector('[data-testid="element"]')

# Re-run to confirm it's not a real failure
npm run test:e2e

# View trace on failure
open playwright-report/index.html
```

## Performance Targets

| Test Type | Target | Typical | Status |
|-----------|--------|---------|--------|
| Unit tests | <5s | ~5s | ✅ On track |
| Integration tests | <20s | ~15s | ✅ On track |
| E2E tests | <2min | ~30s | ✅ On track |
| All tests | <3min | ~60s | ✅ On track |
| Coverage analysis | <1min | ~20s | ✅ On track |

## IDE Integration

### VS Code

Install extensions:
```json
{
  "recommendations": [
    "vitest.explorer",           // Vitest test explorer
    "ms-playwright.playwright",  // Playwright test integration
    "bradlc.vscode-tailwindcss" // Already installed
  ]
}
```

Run tests from VS Code:
- Ctrl+Shift+T (Vitest: Run tests)
- Ctrl+Shift+P → "Playwright: Open test")
- Right-click test → Run/Debug

## Next Steps

1. **Write First Test**: Start with a utility function test (see example above)
2. **Run Tests**: Execute `npm run test:unit:watch` to see live feedback
3. **Add E2E Flow**: Create template CRUD E2E test
4. **Check Coverage**: Run `npm run test:coverage` and view report
5. **Integrate CI/CD**: Configure GitHub Actions to run tests on PR

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [React Testing Library](https://testing-library.com/react)
- [PostCraft Testing Guide](../README.md)

## Questions?

See the full specification: `/specs/003-e2e-unit-testing/spec.md`
See implementation plan: `/specs/003-e2e-unit-testing/plan.md`
See data model: `/specs/003-e2e-unit-testing/data-model.md`
