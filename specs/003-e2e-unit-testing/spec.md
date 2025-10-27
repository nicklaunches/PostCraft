# Feature Specification: E2E Testing and Unit Testing Implementation

**Feature Branch**: `003-e2e-unit-testing`
**Created**: October 27, 2025
**Status**: Draft
**Input**: User description: "implement E2E testing and unit test in our project based on #codebase and existing functionality"

## Clarifications

### Session 2025-10-27

- Q: Which unit test framework should be used? → A: Vitest
- Q: Which E2E testing framework should be used? → A: Playwright
- Q: Should tests run in parallel or sequentially? → A: Parallel with isolation
- Q: How should flaky tests be handled? → A: Retry with threshold
- Q: How should external services (Unlayer API) be handled in tests? → A: Mock external services

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Unit Tests for Utility Functions (Priority: P1)

Developers need to validate that core utility functions (validation, variable detection, JSON parsing) work correctly in isolation before integrating them into components or API routes. This ensures early bug detection and regression prevention during refactoring.

**Why this priority**: These utility functions are the foundation of the application. If validation or variable detection fails, the entire template management system breaks. Testing these first provides confidence for all dependent code.

**Independent Test**: Can be fully tested by running unit tests in isolation using a test runner (e.g., `npm test`). Each utility function can be tested with multiple inputs/outputs without requiring a database, API server, or UI. Success is determined by test pass/fail status.

**Acceptance Scenarios**:

1. **Given** a developer has made changes to validation utilities, **When** they run unit tests, **Then** all validation tests pass with clear output showing which functions passed/failed
2. **Given** a developer is implementing a new validation rule, **When** they write a failing test first (TDD), **Then** the test fails as expected and guides implementation
3. **Given** validation utilities receive invalid input, **When** unit tests run, **Then** functions return appropriate error messages and do not throw unhandled exceptions
4. **Given** variable detection receives HTML with merge tags, **When** detectVariables() is tested, **Then** all uppercase variables are extracted and duplicates are removed
5. **Given** unlayer-validation receives malformed JSON, **When** parseAndValidateJSON() is tested, **Then** it returns valid=false with clear error messages

---

### User Story 2 - Run E2E Tests for Template CRUD Workflows (Priority: P1)

Developers and QA engineers need to verify that complete user workflows (create, read, update, delete templates) function correctly from browser interaction through API to database. This ensures all layers integrate properly and user-facing features work as expected.

**Why this priority**: Template CRUD operations are the core functionality of PostCraft. E2E tests provide confidence that the entire stack works together and catch integration bugs that unit tests miss.

**Independent Test**: Can be fully tested by launching the application in a test environment, using a test runner (e.g., Playwright, Cypress) to simulate user interactions, and verifying database state changes. Tests can run against a clean test database independently of other features.

**Acceptance Scenarios**:

1. **Given** a developer commits code changes, **When** E2E tests run in CI/CD pipeline, **Then** all template CRUD workflows execute successfully with clear pass/fail reporting
2. **Given** a user navigates to /templates/new, **When** they enter a template name, design content, and click save, **Then** the template appears in the templates list with correct data
3. **Given** a template exists with ID=5, **When** a user opens /templates/5/edit, **Then** the editor loads with the correct design and variables
4. **Given** a user clicks delete on a template, **When** they confirm the deletion, **Then** the template is removed from the list and database
5. **Given** a user imports a JSON template file, **When** the import completes, **Then** the editor loads with the imported design ready for editing

---

### User Story 3 - Run API Endpoint Tests (Priority: P2)

Developers need to validate that API endpoints handle requests/responses correctly, enforce validation rules, and return appropriate HTTP status codes. This ensures API contracts are maintained and frontend developers can rely on consistent behavior.

**Why this priority**: API tests verify the backend logic independently of the UI, enabling faster testing cycles and ensuring frontend/backend teams can work in parallel confidently.

**Independent Test**: Can be fully tested by starting the Next.js server in test mode, making HTTP requests to API endpoints, and verifying response payloads and status codes. No UI interaction required.

**Acceptance Scenarios**:

1. **Given** a developer runs API tests, **When** POST /api/templates is called with valid data, **Then** a 201 response is returned with the created template
2. **Given** POST /api/templates receives invalid template name, **When** the request is processed, **Then** a 400 response is returned with field-specific error message
3. **Given** GET /api/templates is called with pagination params, **When** the response is received, **Then** it contains paginated items and correct pagination metadata
4. **Given** PUT /api/templates/[id] is called with new variables, **When** the transaction completes, **Then** old variables are deleted and new variables are inserted atomically
5. **Given** DELETE /api/templates/[id] is called for non-existent ID, **When** the request is processed, **Then** a 404 response is returned with appropriate error message

---

### User Story 4 - Run Integration Tests for Database Operations (Priority: P2)

Developers need to verify that database queries, transactions, and schema constraints work correctly with Drizzle ORM. This ensures data integrity and catches issues with foreign key cascades, unique constraints, and transaction rollbacks.

**Why this priority**: Database operations involve complex transaction logic (template + variables) and rely on foreign key constraints for cascade deletes. Integration tests ensure these critical operations maintain data consistency.

**Independent Test**: Can be fully tested by connecting to a test database, executing database operations through Drizzle ORM, and verifying the resulting state. Tests can run independently with database migrations applied fresh before each test suite.

**Acceptance Scenarios**:

1. **Given** a template is created with variables, **When** the transaction executes, **Then** both template and variables are inserted or the entire transaction rolls back on failure
2. **Given** a template is deleted, **When** the cascade delete triggers, **Then** all associated template_variables rows are automatically deleted
3. **Given** two templates with same name are created, **When** the second insert attempts, **Then** a unique constraint violation occurs and is handled gracefully
4. **Given** template variables are updated, **When** the update transaction runs, **Then** old variables are deleted before new ones are inserted within the same transaction
5. **Given** an invalid template ID is queried, **When** the database returns no results, **Then** the application handles the null case appropriately

---

### User Story 5 - View Test Coverage Reports (Priority: P3)

Developers and team leads need to see which parts of the codebase are covered by tests and identify untested code paths. This enables data-driven decisions about where to add more tests and ensures critical code is not overlooked.

**Why this priority**: Coverage reporting provides visibility into testing gaps but doesn't directly affect functionality. It's valuable for continuous improvement but not essential for initial testing setup.

**Independent Test**: Can be fully tested by running the test suite with coverage reporting enabled (e.g., `npm test -- --coverage`) and verifying that a coverage report is generated showing percentages for statements, branches, functions, and lines.

**Acceptance Scenarios**:

1. **Given** a developer runs tests with coverage enabled, **When** tests complete, **Then** a coverage report is generated showing percentages for all source files
2. **Given** a coverage report is generated, **When** it is viewed, **Then** it highlights which files/functions are untested with clear visual indicators
3. **Given** coverage thresholds are configured, **When** coverage falls below thresholds, **Then** the test run fails with a clear message indicating which areas need more tests
4. **Given** a developer adds new code, **When** they run coverage, **Then** the report reflects the new code and shows if it is tested

---

### Edge Cases

- What happens when test database connection fails during E2E tests? (Tests MUST fail gracefully with clear error message indicating database connectivity issue)
- How does system handle concurrent test runs? (Tests MUST use isolated database instances or transaction rollback to prevent interference; parallel execution is required for performance targets)
- What happens when a test times out due to slow operations? (Test runner MUST report timeout with details about which test exceeded limits; E2E tests have 30-second default timeout per test)
- How are flaky tests handled? (Tests MUST automatically retry up to 2-3 times on failure; if still failing after retries, test is marked as flaky and reported separately from genuine failures)
- How are file uploads tested in E2E tests? (Tests MUST use fixture files from examples/ directory to simulate real file uploads)
- What happens when API tests run against a database with stale migrations? (Tests MUST detect schema mismatches and fail with clear migration instructions)
- How are environment variables handled in test mode? (Tests MUST use separate test environment configuration without affecting development database)
- How are external services (Unlayer API) handled in tests? (Unit and integration tests MUST mock external services for speed and isolation; E2E tests MAY use test project ID with fixtures; no tests should depend on external service uptime or consume production API quotas)

## Requirements *(mandatory)*

### Functional Requirements

#### Unit Testing Requirements

- **FR-001**: System MUST provide unit tests for all validation utilities in lib/utils/ including validation.ts, api-validation.ts, variable-validation.ts, unlayer-validation.ts, and variable-detection.ts
- **FR-002**: System MUST test validation functions with valid inputs, invalid inputs, edge cases (empty strings, null, undefined), and boundary conditions (max length, min length)
- **FR-003**: Unit tests MUST verify error messages returned by validation functions match expected user-facing error text defined in VALIDATION_ERRORS constants
- **FR-004**: System MUST provide unit tests for variable detection functions including detectVariables() and deduplicateVariables() with various HTML inputs
- **FR-005**: Unit tests MUST verify that detectVariables() correctly identifies {{UPPERCASE_VARS}} and ignores {{lowercase}}, {{Mixed_Case}}, and {{ spaced }} patterns
- **FR-006**: System MUST test Unlayer JSON validation including isValidUnlayerDesign(), parseAndValidateJSON(), validateFile(), and validateTextareaContent()
- **FR-007**: Unit tests MUST execute in under 5 seconds for the entire suite (fast feedback loop for TDD)
- **FR-008**: Unit tests MUST be runnable via npm test command and provide clear pass/fail output with details on failing assertions

#### E2E Testing Requirements

- **FR-009**: System MUST provide E2E tests for complete template creation workflow (navigate to /templates/new, enter name, save, verify in list)
- **FR-010**: System MUST provide E2E tests for template editing workflow (open existing template, modify content, save, verify changes persisted)
- **FR-011**: System MUST provide E2E tests for template deletion workflow (click delete button, confirm dialog, verify removal from list and database)
- **FR-012**: System MUST provide E2E tests for template import workflow (upload JSON file, verify redirect to editor, verify design loaded)
- **FR-013**: E2E tests MUST verify UI state changes including loading states, error messages, success notifications, and empty states
- **FR-014**: E2E tests MUST verify pagination functionality on /templates page (navigate between pages, verify correct items displayed)
- **FR-015**: E2E tests MUST run against a test database that is reset before each test to ensure clean state
- **FR-016**: E2E tests MUST capture screenshots on test failures for debugging purposes
- **FR-017**: System MUST support running E2E tests in both headed mode (visible browser) and headless mode (CI/CD), with automatic retry logic for failed tests (exactly 2 retry attempts per test = 3 total attempts including initial run; tests passing on retry are marked as "flaky" in reports)

#### API Testing Requirements

- **FR-018**: System MUST provide API tests for GET /api/templates verifying response structure, pagination metadata, and status codes
- **FR-019**: System MUST provide API tests for POST /api/templates verifying template creation, validation error handling, and unique constraint enforcement
- **FR-020**: System MUST provide API tests for GET /api/templates/[id] verifying single template retrieval, 404 handling, and variable inclusion
- **FR-021**: System MUST provide API tests for PUT /api/templates/[id] verifying template updates, variable replacement, and transaction atomicity
- **FR-022**: System MUST provide API tests for DELETE /api/templates/[id] verifying cascade delete and 404 handling
- **FR-023**: API tests MUST verify that validation errors return 400 status with field-specific error messages matching ValidationResult structure
- **FR-024**: API tests MUST verify transaction rollback behavior when database operations fail during multi-step operations

#### Integration Testing Requirements

- **FR-025**: System MUST provide integration tests for database operations using real Drizzle ORM queries against test database
- **FR-026**: Integration tests MUST verify foreign key cascade delete behavior (deleting template removes associated variables)
- **FR-027**: Integration tests MUST verify unique constraint enforcement on template names
- **FR-028**: Integration tests MUST verify transaction atomicity for template creation (template + variables inserted together or both fail)
- **FR-029**: Integration tests MUST verify transaction atomicity for template updates (content + variables updated together or both fail)
- **FR-030**: Integration tests MUST run database migrations before test execution to ensure schema is current AND support parallel execution with test isolation via transaction rollback (each test runs in isolated transaction that rolls back after completion, providing fast cleanup while maintaining deterministic state)

#### Testing Infrastructure Requirements

- **FR-031**: System MUST use Vitest as the unit test framework with native TypeScript and ESM support for fast execution and excellent Next.js App Router integration
- **FR-032**: System MUST use Playwright as the E2E testing framework with TypeScript support, parallel execution, auto-wait features, and trace viewer for debugging
- **FR-033**: System MUST provide npm scripts for running different test types: test, test:unit, test:e2e, test:integration, test:coverage
- **FR-034**: System MUST configure test environment variables separate from development (e.g., TEST_DATABASE_URL)
- **FR-035**: System MUST provide test database setup/teardown utilities for cleaning state between tests
- **FR-036**: System MUST generate code coverage reports showing statement, branch, function, and line coverage percentages
- **FR-037**: System MUST configure minimum coverage thresholds (recommend: 80% for utilities, 70% overall)
- **FR-038**: System MUST provide example test files demonstrating testing patterns for components, API routes, and utilities
- **FR-039**: System MUST include test documentation in README.md with instructions for running tests locally and in CI/CD
- **FR-040**: System MUST mock external services (specifically Unlayer API) in unit and integration tests to ensure fast, isolated, reliable tests that don't depend on external service availability or consume API quotas; E2E tests MAY use a test project ID with known fixtures
- **FR-041**: Test setup MUST verify database schema is current by comparing applied migrations against migration files, failing fast with clear error message if schema drift is detected (unapplied migrations or manual schema changes)

### Key Entities *(include if feature involves data)*

- **Test Database**: Separate PostgreSQL database instance used exclusively for running tests, reset before each test run to ensure clean state
- **Test Fixtures**: Sample data files (JSON templates, HTML snippets) stored in examples/ or tests/fixtures/ used as input for tests
- **Test Configuration**: Environment-specific settings (database URLs, API endpoints, timeouts) stored in test configuration files
- **Coverage Report**: Generated artifact showing which code paths are executed by tests, includes metrics for statements, branches, functions, and lines

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can run unit tests in under 5 seconds with clear pass/fail output and detailed error messages for failing tests
- **SC-002**: E2E test suite completes full template CRUD workflow testing in under 2 minutes per run
- **SC-003**: API endpoint tests verify all 5 template endpoints (GET list, POST create, GET single, PUT update, DELETE) with comprehensive scenarios
- **SC-004**: Code coverage reports show at least 80% coverage for utility functions (validation, variable detection) and 70% overall project coverage
- **SC-005**: Tests catch regressions when validation rules change, preventing invalid data from reaching the database
- **SC-006**: E2E tests detect UI regressions (broken forms, missing buttons, incorrect navigation) before production deployment
- **SC-007**: Developers can run tests locally without complex setup beyond installing dependencies and configuring test database URL
- **SC-008**: CI/CD pipeline runs all tests on every commit and fails builds when tests fail, ensuring no untested code reaches production
- **SC-009**: Test failures provide actionable error messages indicating which assertion failed and what the expected vs actual values were
- **SC-010**: New developers can understand testing approach by reading example tests and documentation within 30 minutes

