# Implementation Plan: E2E Testing and Unit Testing Implementation

**Branch**: `003-e2e-unit-testing` | **Date**: October 27, 2025 | **Spec**: `/specs/003-e2e-unit-testing/spec.md`
**Input**: Feature specification with developer testing framework requirements

## Summary

PostCraft requires comprehensive testing infrastructure with unit tests (Vitest), E2E tests (Playwright), API endpoint tests, integration tests, and coverage reporting. The implementation adds testing frameworks, test setup utilities, test database configuration, npm scripts, documentation, and example test files demonstrating testing patterns. External services (Unlayer API) are mocked to ensure fast, isolated, quota-safe tests. Tests run in parallel with database isolation for performance while maintaining deterministic results.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20+, Next.js 14+
**Primary Dependencies**: Vitest 2.0+, Playwright 1.50+, @testing-library/react 16.0+
**Storage**: PostgreSQL 16+ (separate TEST_DATABASE_URL for test isolation)
**Testing**: Vitest (unit), Playwright (E2E), React Testing Library (components)
**Target Platform**: Web application (Next.js App Router) with local studio
**Project Type**: Full-stack web (next.js with API routes + React components)
**Performance Goals**: Unit tests <5 seconds, E2E tests <2 minutes total, API response p95 <200ms
**Constraints**: Tests must run in parallel with isolation; external services mocked; no production data in test runs
**Scale/Scope**: ~30 test suites (5 unit + 5 integration + 5 API + 5 E2E + coverage config), ~200+ individual test cases

## Constitution Check

*GATE: All principles verified below. No violations.*

### Constitution Principle Compliance

**✅ Principle I: Type Safety First**
- All test files use TypeScript with strict mode
- Test fixtures have typed schemas
- Mock utilities have proper TypeScript interfaces
- Database test helpers use Drizzle ORM types
- Status: **PASS** - Test setup enforces TypeScript strict mode in vitest.config.ts

**✅ Principle II: shadcn/ui Component Consistency**
- Not applicable to testing framework itself
- E2E tests verify shadcn/ui components render correctly
- Component tests use React Testing Library (complementary to shadcn/ui)
- Status: **PASS** - Testing approach respects shadcn/ui usage patterns

**✅ Principle III: Test-Driven Development**
- This feature implements TDD infrastructure enabling the principle
- All new code contributions will follow Red-Green-Refactor cycle
- Contract tests verify API endpoint specifications before implementation
- Status: **PASS** - Feature establishes TDD as standard practice

**✅ Principle IV: UX State Completeness**
- E2E tests verify loading, success, error, and empty states
- Tests confirm keyboard navigation and accessibility
- Test suite includes scenarios for UI state transitions
- Status: **PASS** - Testing infrastructure validates all four UI states

**✅ Principle V: Database Schema as Code**
- Drizzle ORM manages all schema definitions
- Test database uses same schema as production (via migrations)
- Test setup runs full migration suite before test runs
- Status: **PASS** - Tests ensure schema integrity through migration verification

**✅ Principle VI: Performance Budgets**
- Unit tests target <5 seconds (Vitest default with 4 workers)
- E2E tests target <2 minutes (Playwright parallel execution)
- Coverage reports identify performance-impacting untested code paths
- Status: **PASS** - Testing infrastructure enables performance monitoring

**✅ Principle VII: Security by Default**
- Tests use separate TEST_DATABASE_URL environment variable
- No production credentials in test fixtures or mock data
- Tests verify localhost-only binding (127.0.0.1)
- External service mocking prevents credential exposure
- Status: **PASS** - Test environment fully isolated from production

**✅ Principle VIII: JSDoc Documentation & File Purpose**
- All test files include file-level JSDoc describing purpose
- Test utilities documented with @param, @returns, @example blocks
- Complex test logic includes inline comments explaining assertions
- Test data factories documented with usage examples
- Status: **PASS** - Testing infrastructure includes comprehensive JSDoc

### Gate Evaluation Results

| Principle | Assessment | Required Action | Status |
|-----------|------------|-----------------|--------|
| Type Safety | All test files strictly typed | None - enforced by vitest.config.ts | ✅ PASS |
| shadcn/ui | Component tests respect patterns | None - tests verify component usage | ✅ PASS |
| TDD | Infrastructure implements principle | None - feature enables TDD | ✅ PASS |
| UX State | E2E tests verify all states | None - test suite comprehensive | ✅ PASS |
| Schema | Drizzle migrations in tests | None - migration runner in setup | ✅ PASS |
| Performance | Budget enforcement via tooling | None - Vitest/Playwright native | ✅ PASS |
| Security | Isolation via test environment | None - environment-based | ✅ PASS |
| JSDoc | Documentation standard applied | None - enforced in code review | ✅ PASS |

**Gate Result**: ✅ **PASS** - No violations. Feature aligns with all constitutional principles.

## Project Structure

### Documentation (this feature)

```
specs/003-e2e-unit-testing/
├── plan.md              # This file (Phase 0 complete)
├── research.md          # Phase 0 output (COMPLETE - research.md generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   ├── test-infrastructure.ts
│   ├── vitest-config.ts
│   └── playwright-config.ts
└── tasks.md             # Phase 2 output (to be generated by /speckit.tasks)
```

### Source Code (repository root)

**Selected Structure**: Web application with test directory at repository root (standard Next.js pattern)

```
root/
├── lib/                          # Existing: core utilities
│   ├── utils/                    # Existing: utility functions (validation, detection, etc)
│   ├── db/
│   │   └── schema.ts             # Existing: Drizzle schema definitions
│   └── sdk/
│
├── app/
│   └── api/                      # Existing: Next.js API routes
│       ├── templates/            # Existing: Template CRUD endpoints
│       └── route.ts
│
├── components/                   # Existing: React components
│
├── tests/                        # NEW: Test infrastructure root
│   ├── setup.ts                  # NEW: Global test setup & fixtures
│   ├── db-setup.ts               # NEW: Database utilities for tests
│   ├── mocks/                    # NEW: Mock factories and fixtures
│   │   ├── unlayer.ts            # NEW: Unlayer API mock
│   │   └── fixtures/
│   │       ├── sample-template.json
│   │       └── variables.json
│   ├── unit/                     # NEW: Unit tests
│   │   ├── validation.test.ts
│   │   ├── variable-detection.test.ts
│   │   ├── unlayer-validation.test.ts
│   │   └── api-validation.test.ts
│   ├── integration/              # NEW: Integration tests
│   │   ├── templates.integration.test.ts
│   │   └── template-variables.integration.test.ts
│   ├── e2e/                      # NEW: E2E tests (Playwright)
│   │   ├── template-crud.spec.ts
│   │   ├── template-import.spec.ts
│   │   ├── template-pagination.spec.ts
│   │   └── fixtures/
│   │       └── sample-unlayer-template.json
│   └── api/                      # NEW: API endpoint tests
│       ├── templates.api.test.ts
│       └── fixtures/
│           └── template-payloads.json
│
├── vitest.config.ts              # NEW: Vitest configuration
├── playwright.config.ts          # NEW: Playwright configuration
│
├── .env.test                     # NEW: Test environment variables
└── package.json                  # MODIFIED: Add test scripts + dependencies
```

**Structure Rationale**:
- Tests in `/tests` directory (standard convention for Next.js)
- Tests co-located by type (unit/integration/e2e) not by source location for clarity
- Mocks and fixtures in separate `mocks/` and `fixtures/` directories for reusability
- Config files at repository root for visibility and tooling compatibility
- `.env.test` for test-specific environment (TEST_DATABASE_URL, etc.)

## Complexity Tracking

**No violations to document** - All constitutional principles are satisfied by the testing infrastructure design.

This feature is primarily infrastructure; it doesn't violate any principles. All design decisions align with:
- Type safety (TypeScript strict mode in tests)
- TDD enablement (the feature implements TDD)
- Performance budgets (Vitest/Playwright support targets)
- Security (test database isolation)
- JSDoc documentation (all test utilities documented)

No complexity exceptions or workarounds required.

