# Tasks: E2E Testing and Unit Testing Implementation

**Feature Branch**: `003-e2e-unit-testing`
**Input**: Design documents from `/specs/003-e2e-unit-testing/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: This feature implements the testing infrastructure itself. Test tasks are included to demonstrate the testing patterns after infrastructure is set up.

**Organization**: Tasks are grouped by user story (P1-P3) to enable independent implementation and testing of each capability.

**Total Tasks**: 65 (T001-T064 + T008a for schema drift detection)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions
- Project root: `/Users/sitemax/Projects/postcraft.dev/PostCraft/`
- Tests: `tests/` at repository root
- Configs: `vitest.config.ts`, `playwright.config.ts` at root
- Existing code: `lib/`, `app/`, `components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install testing frameworks and create basic configuration

- [x] T001 Install Vitest and related dependencies (vitest@^2.0.0, @vitest/ui@^2.0.0, @vitest/coverage-v8@^2.0.0) in package.json
- [x] T002 Install Playwright and testing libraries (@playwright/test@^1.50.0, @testing-library/react@^16.0.0, @testing-library/jest-dom@^6.0.0) in package.json
- [x] T003 [P] Create .env.test file with TEST_DATABASE_URL, TEST_API_BASE_URL, TEST_E2E_BASE_URL
- [x] T004 [P] Create tests/ directory structure (setup.ts, db-setup.ts, mocks/, unit/, integration/, e2e/, api/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core test infrastructure that MUST be complete before ANY test implementation

**⚠️ CRITICAL**: No test writing can begin until this phase is complete

- [x] T005 Create vitest.config.ts with TypeScript, ESM, Node environment, 4 workers, 10s timeout, coverage configuration
- [x] T006 Create playwright.config.ts with TypeScript, parallel execution, retries (exactly 2 retries per test = 3 total attempts), 30s timeout, trace on retry, webServer configuration
- [x] T007 Implement tests/db-setup.ts with setupTestDatabase(), resetDatabase() using transaction rollback strategy for parallel execution, seedFixtures(), cleanup() functions
- [x] T008 Implement tests/setup.ts with global test setup, Vitest globals import, database migration runner, environment validation
- [x] T008a Implement schema drift detection in tests/setup.ts verifying applied migrations match migration files, failing fast with clear error if mismatch detected
- [x] T009 [P] Create tests/mocks/unlayer.ts with createUnlayerMock() factory implementing MockUnlayerAPI interface
- [x] T010 [P] Create tests/mocks/fixtures/sample-template.json with valid Unlayer design JSON
- [x] T011 [P] Create tests/mocks/fixtures/variables.json with sample TemplateVariable fixtures
- [x] T012 Add npm scripts to package.json: test, test:watch, test:unit, test:unit:watch, test:integration, test:e2e, test:e2e:headed, test:e2e:debug, test:coverage, test:ci

**Checkpoint**: Foundation ready - test implementation can now begin in parallel

---

## Phase 3: User Story 1 - Run Unit Tests for Utility Functions (Priority: P1) 🎯 MVP

**Goal**: Validate core utility functions (validation, variable detection, JSON parsing) work correctly in isolation

**Independent Test**: Run `npm run test:unit` and verify all utility function tests pass in <5 seconds with clear pass/fail output

### Implementation for User Story 1

- [x] T013 [P] [US1] Create tests/unit/validation.test.ts testing validation utilities with valid/invalid/edge cases
- [x] T014 [P] [US1] Create tests/unit/variable-detection.test.ts testing detectVariables() and deduplicateVariables() with various HTML inputs
- [x] T015 [P] [US1] Create tests/unit/unlayer-validation.test.ts testing isValidUnlayerDesign(), parseAndValidateJSON(), validateFile(), validateTextareaContent()
- [x] T016 [P] [US1] Create tests/unit/api-validation.test.ts testing API request validation utilities
- [x] T017 [US1] Verify all unit tests execute in <5 seconds via npm run test:unit
- [x] T018 [US1] Verify unit tests provide clear error messages with expected vs actual values
- [x] T019 [US1] Verify validation error messages match VALIDATION_ERRORS constants from source files

**Checkpoint**: Unit tests for utilities complete - developers can now run `npm run test:unit` for instant feedback

---

## Phase 4: User Story 2 - Run E2E Tests for Template CRUD Workflows (Priority: P1)

**Goal**: Verify complete user workflows (create, read, update, delete templates) function correctly from browser to database

**Independent Test**: Run `npm run test:e2e` and verify all template CRUD workflows pass with screenshots captured on failures

### Implementation for User Story 2

- [x] T020 [P] [US2] Create tests/e2e/fixtures/sample-unlayer-template.json with known valid Unlayer design for E2E test uploads
- [x] T021 [P] [US2] Create tests/e2e/template-crud.spec.ts testing create template workflow (navigate /templates/new, enter name, save, verify in list)
- [x] T022 [P] [US2] Add edit template workflow test to tests/e2e/template-crud.spec.ts (open template by ID, modify, save, verify persistence)
- [x] T023 [P] [US2] Add delete template workflow test to tests/e2e/template-crud.spec.ts (click delete, confirm, verify removal from list and database)
- [x] T024 [P] [US2] Create tests/e2e/template-import.spec.ts testing import workflow (upload JSON file, verify redirect, verify design loaded in editor)
- [x] T025 [P] [US2] Create tests/e2e/template-pagination.spec.ts testing pagination (navigate pages, verify correct items displayed)
- [x] T026 [US2] Add UI state verification to E2E tests (loading states, error messages, success notifications, empty states)
- [x] T027 [US2] Configure Playwright to capture screenshots on failure and save to playwright-report/
- [ ] T028 [US2] Verify E2E tests complete in <2 minutes with npm run test:e2e
- [ ] T029 [US2] Verify E2E tests work in headed mode with npm run test:e2e:headed

**Checkpoint**: E2E tests complete - full user workflows validated from UI to database

---

## Phase 5: User Story 3 - Run API Endpoint Tests (Priority: P2)

**Goal**: Validate API endpoints handle requests/responses correctly with proper status codes and validation

**Independent Test**: Run `npm run test:unit -- tests/api/` and verify all API endpoint tests pass independently of UI

### Implementation for User Story 3

- [ ] T030 [P] [US3] Create tests/api/fixtures/template-payloads.json with valid/invalid request payloads for API testing
- [ ] T031 [P] [US3] Create tests/api/templates.api.test.ts with GET /api/templates tests (pagination, response structure, status codes)
- [ ] T032 [P] [US3] Add POST /api/templates tests to tests/api/templates.api.test.ts (valid creation, validation errors, unique constraint violations)
- [ ] T033 [P] [US3] Add GET /api/templates/[id] tests to tests/api/templates.api.test.ts (single template retrieval, 404 handling, variable inclusion)
- [ ] T034 [P] [US3] Add PUT /api/templates/[id] tests to tests/api/templates.api.test.ts (updates, variable replacement, transaction atomicity)
- [ ] T035 [P] [US3] Add DELETE /api/templates/[id] tests to tests/api/templates.api.test.ts (cascade delete, 404 handling)
- [ ] T036 [US3] Verify API tests validate 400 errors return field-specific messages matching ValidationResult structure
- [ ] T037 [US3] Verify API tests confirm transaction rollback on multi-step operation failures

**Checkpoint**: API endpoint tests complete - backend contracts verified independently

---

## Phase 6: User Story 4 - Run Integration Tests for Database Operations (Priority: P2)

**Goal**: Verify database queries, transactions, and schema constraints work correctly with Drizzle ORM

**Independent Test**: Run `npm run test:integration` and verify database operations maintain data integrity with real Drizzle ORM

### Implementation for User Story 4

- [ ] T038 [P] [US4] Create tests/integration/templates.integration.test.ts testing template CRUD operations with real database
- [ ] T039 [P] [US4] Add template creation transaction tests to tests/integration/templates.integration.test.ts (template + variables atomicity)
- [ ] T040 [P] [US4] Add unique constraint tests to tests/integration/templates.integration.test.ts (duplicate template names handled gracefully)
- [ ] T041 [P] [US4] Create tests/integration/template-variables.integration.test.ts testing variable operations
- [ ] T042 [P] [US4] Add foreign key cascade delete tests to tests/integration/template-variables.integration.test.ts (template deletion removes variables)
- [ ] T043 [P] [US4] Add transaction rollback tests for failed operations (partial inserts/updates roll back completely)
- [ ] T044 [US4] Verify integration tests run database migrations before execution
- [ ] T045 [US4] Verify integration tests use TEST_DATABASE_URL not POSTCRAFT_DATABASE_URL
- [ ] T046 [US4] Verify integration tests reset database state between test suites

**Checkpoint**: Integration tests complete - database layer verified with real ORM and schema

---

## Phase 7: User Story 5 - View Test Coverage Reports (Priority: P3)

**Goal**: Generate coverage reports showing which code paths are tested and identify untested areas

**Independent Test**: Run `npm run test:coverage` and verify coverage report generated with percentages for statements/branches/functions/lines

### Implementation for User Story 5

- [ ] T047 [US5] Verify coverage configuration in vitest.config.ts includes lib/**/*.ts and app/api/**/*.ts
- [ ] T048 [US5] Verify coverage excludes test files (**/*.test.ts, **/node_modules/**)
- [ ] T049 [US5] Verify coverage thresholds set to 70% minimum (lines, functions, branches, statements)
- [ ] T050 [US5] Verify coverage reporters include text, html, json formats
- [ ] T051 [US5] Run npm run test:coverage and verify HTML report generated in coverage/index.html
- [ ] T052 [US5] Verify coverage report highlights untested files/functions with visual indicators
- [ ] T053 [US5] Verify test run fails when coverage falls below configured thresholds
- [ ] T054 [US5] Verify coverage report reflects new code additions and shows if they are tested

**Checkpoint**: Coverage reporting complete - developers can track test coverage metrics

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, CI/CD integration, and final validation

- [ ] T055 [P] Update README.md with Testing section documenting npm test commands and prerequisites
- [ ] T056 [P] Add test database setup instructions to README.md (create test DB, configure .env.test)
- [ ] T057 [P] Document testing patterns in README.md with examples from unit/integration/e2e tests
- [ ] T058 [P] Create .github/workflows/test.yml for CI/CD with PostgreSQL service, test execution, coverage upload, artifact retention
- [ ] T059 [P] Add VS Code recommended extensions to .vscode/extensions.json (vitest.explorer, ms-playwright.playwright)
- [ ] T060 Verify all tests pass with npm run test:ci (lint + coverage + e2e)
- [ ] T061 Verify performance targets met (unit <5s, E2E <2min, overall <3min)
- [ ] T062 Run quickstart.md validation - verify all commands work as documented
- [ ] T063 Verify test isolation works with parallel execution (4 workers, no interference)
- [ ] T064 Verify flaky test retry logic works (playwright.config.ts retries: 2) by running E2E test suite 3 times and confirming transient failures pass on retry and are marked as flaky in test reports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all test implementation
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Unit Tests): Can start immediately after Foundational
  - US2 (E2E Tests): Can start immediately after Foundational
  - US3 (API Tests): Can start immediately after Foundational
  - US4 (Integration Tests): Can start immediately after Foundational
  - US5 (Coverage): Can start immediately after Foundational (but benefits from other tests existing)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Unit Tests)**: Independent - can start after Foundational
- **User Story 2 (P1 - E2E Tests)**: Independent - can start after Foundational
- **User Story 3 (P2 - API Tests)**: Independent - can start after Foundational
- **User Story 4 (P2 - Integration Tests)**: Independent - can start after Foundational
- **User Story 5 (P3 - Coverage)**: Independent - can start after Foundational (most valuable when other tests exist)

### Within Each User Story

**US1 (Unit Tests)**:
- All test file creation tasks (T013-T016) can run in parallel [P]
- Verification tasks (T017-T019) run after test files created

**US2 (E2E Tests)**:
- Fixture creation (T020) can run in parallel with test files
- All test spec creation (T021-T025) can run in parallel [P]
- Verification/configuration tasks (T026-T029) run after test files created

**US3 (API Tests)**:
- Fixture creation (T030) can run in parallel with test files
- All API test creation (T031-T035) can run in parallel [P]
- Verification tasks (T036-T037) run after test files created

**US4 (Integration Tests)**:
- All test file creation tasks (T038-T043) can run in parallel [P]
- Verification tasks (T044-T046) run after test files created

**US5 (Coverage)**:
- All verification tasks (T047-T054) can run in any order

**Phase 8 (Polish)**:
- Documentation tasks (T055-T059) can run in parallel [P]
- Verification tasks (T060-T064) run after documentation complete

### Parallel Opportunities

**Phase 1 (Setup)**: All 4 tasks can run in parallel if coordinated

**Phase 2 (Foundational)**:
- Config files (T005, T006) in parallel
- Setup utilities (T007, T008) in parallel
- Mock utilities (T009-T011) in parallel
- npm scripts (T012) independent

**Phase 3-7 (User Stories)**:
- **ALL user stories can be worked on in parallel** by different team members after Phase 2 completes
- Within each story, tasks marked [P] can run in parallel

**Phase 8 (Polish)**:
- All documentation tasks in parallel
- Verification tasks sequential

---

## Parallel Example: After Foundational Complete

```bash
# Team member A works on User Story 1 (Unit Tests):
Batch 1 [parallel]:
  T013: Create tests/unit/validation.test.ts
  T014: Create tests/unit/variable-detection.test.ts
  T015: Create tests/unit/unlayer-validation.test.ts
  T016: Create tests/unit/api-validation.test.ts
Then:
  T017-T019: Verify unit test behavior

# Team member B works on User Story 2 (E2E Tests):
Batch 1 [parallel]:
  T020: Create tests/e2e/fixtures/sample-unlayer-template.json
  T021: Create tests/e2e/template-crud.spec.ts
  T022: Add edit workflow
  T023: Add delete workflow
  T024: Create tests/e2e/template-import.spec.ts
  T025: Create tests/e2e/template-pagination.spec.ts
Then:
  T026-T029: Configure and verify E2E tests

# Team member C works on User Story 3 (API Tests):
Batch 1 [parallel]:
  T030: Create tests/api/fixtures/template-payloads.json
  T031: Create tests/api/templates.api.test.ts (GET list)
  T032: Add POST tests
  T033: Add GET single tests
  T034: Add PUT tests
  T035: Add DELETE tests
Then:
  T036-T037: Verify API test behavior

# Team member D works on User Story 4 (Integration Tests):
Batch 1 [parallel]:
  T038: Create tests/integration/templates.integration.test.ts
  T039: Add transaction tests
  T040: Add constraint tests
  T041: Create tests/integration/template-variables.integration.test.ts
  T042: Add cascade delete tests
  T043: Add rollback tests
Then:
  T044-T046: Verify integration test behavior
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. ✅ Complete Phase 1: Setup (install frameworks)
2. ✅ Complete Phase 2: Foundational (test infrastructure ready)
3. ✅ Complete Phase 3: User Story 1 (Unit Tests) - developers can now run `npm run test:unit`
4. ✅ Complete Phase 4: User Story 2 (E2E Tests) - full workflows validated
5. **STOP and VALIDATE**: Run `npm run test` and verify both test suites pass
6. MVP Complete: Basic test infrastructure operational

### Full Feature (All User Stories)

1. Complete MVP (US1 + US2)
2. Add User Story 3 (API Tests) → Independent API validation
3. Add User Story 4 (Integration Tests) → Database layer verified
4. Add User Story 5 (Coverage) → Metrics and reporting
5. Complete Phase 8 (Polish) → Documentation and CI/CD
6. **Full Testing Infrastructure Complete**

### Parallel Team Strategy

With 4 developers after Foundational phase complete:

1. **Developer A**: User Story 1 (Unit Tests)
2. **Developer B**: User Story 2 (E2E Tests)
3. **Developer C**: User Story 3 (API Tests)
4. **Developer D**: User Story 4 (Integration Tests)
5. **All together**: User Story 5 (Coverage) + Phase 8 (Polish)

All user stories are independent and can be completed in parallel, then integrated.

---

## Performance Targets

| Test Type | Target | Tasks Ensuring Target |
|-----------|--------|----------------------|
| Unit tests | <5s | T017 verifies execution time |
| E2E tests | <2min | T028 verifies execution time |
| Integration tests | <20s | Verified via npm run test:integration |
| Full suite | <3min | T061 verifies overall performance |
| Coverage generation | <1min | Verified via npm run test:coverage |

---

## Success Criteria Mapping

| Success Criterion | Verified By Tasks |
|-------------------|-------------------|
| SC-001: Unit tests <5s with clear output | T017, T018 |
| SC-002: E2E tests <2min | T028 |
| SC-003: API tests for all 5 endpoints | T031-T035 |
| SC-004: 80% utility coverage, 70% overall | T049, T051 |
| SC-005: Tests catch validation regressions | T013, T019 |
| SC-006: E2E tests detect UI regressions | T026 |
| SC-007: Simple local setup | T003, T056 |
| SC-008: CI/CD integration | T058 |
| SC-009: Actionable error messages | T018, T036 |
| SC-010: Documentation for new developers | T055-T057, T062 |

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- All tasks follow TDD principle: infrastructure → test examples → verification
- Test database isolation ensures parallel execution safety
- Commit after each task or logical group for incremental progress
- Stop at any checkpoint to validate story independently
- Performance targets validated throughout implementation
