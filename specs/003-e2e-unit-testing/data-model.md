# Data Model: Testing Infrastructure

**Feature**: E2E Testing and Unit Testing Implementation
**Date**: October 27, 2025
**Branch**: `003-e2e-unit-testing`

## Overview

Testing infrastructure doesn't introduce new entities to the application data model. Instead, it defines test-specific data structures for fixtures, mocks, and configuration. This document describes the test data model, test database state, and fixture structures used throughout the test suite.

## Test-Specific Entities

### 1. Test Database State

**Purpose**: Maintain isolated, reproducible test database state

**Schema** (same as production, in `lib/db/schema.ts`):
```typescript
// Test database uses identical schema to production
// Separate TEST_DATABASE_URL prevents interference with development database

// Tables:
- postcraft_templates (id, name, content, html, created_at, updated_at)
- postcraft_template_variables (id, template_id, key, type, fallback_value, is_required, created_at)
```

**Test Database Characteristics**:
- **Isolation**: Separate PostgreSQL database instance via TEST_DATABASE_URL
- **Reset Strategy**: Transaction rollback per test (fast) or full truncate between test suites (reliable)
- **Migrations**: Full migration suite runs before test execution to ensure schema match
- **Concurrency**: Each test worker gets isolated transaction or separate connection pool

**Validation Rules** (inherited from schema):
- Template name must be unique
- Template name cannot be null
- Template content must be valid JSON
- Template variables must reference valid template_id
- Variable key must be unique per template (composite unique constraint)

### 2. Test Fixtures

**Purpose**: Provide reproducible test data representing real user scenarios

#### 2.1 Sample Unlayer Template Fixture

**Location**: `tests/mocks/fixtures/sample-template.json`
**Schema**: UnlayerDesign interface

```typescript
interface UnlayerDesign {
  body: {
    rows: Array<UnlayerRow>;      // Email structure
    values: Record<string, any>;   // Row/column metadata
  };
  counters: {
    u_column: number;             // Column count
    u_row: number;                // Row count
    u_content: number;            // Content item count
  };
  schemaVersion: number;          // Design version
}
```

**Example Fixture Content**:
```json
{
  "body": {
    "rows": [
      {
        "cells": [1],
        "columns": [{
          "contents": [
            {
              "_name": "text",
              "values": {
                "containerWidth": 600,
                "fontSize": 16,
                "text": "Hello {{NAME}}, welcome to our service!"
              }
            }
          ]
        }]
      }
    ],
    "values": {
      "displayVersion": "desktop",
      "preheaderText": "Check out this email"
    }
  },
  "counters": {
    "u_column": 1,
    "u_row": 1,
    "u_content": 1
  },
  "schemaVersion": 28
}
```

**Validation**:
- Must have body.rows array (non-empty)
- Must have counters object with u_column, u_row, u_content
- Must have schemaVersion number
- All required by `isValidUnlayerDesign()` type guard

#### 2.2 Template Variable Fixtures

**Location**: `tests/mocks/fixtures/variables.json`
**Schema**: TemplateVariable[]

```typescript
interface TemplateVariable {
  id: number;
  templateId: number;
  key: string;              // e.g., "NAME", "EMAIL"
  type: string;             // 'string' | 'number' | 'boolean' | 'date'
  fallbackValue?: string;
  isRequired: boolean;
  createdAt: Date;
}
```

**Example Fixture Content**:
```json
[
  {
    "id": 1,
    "templateId": 1,
    "key": "NAME",
    "type": "string",
    "fallbackValue": "Valued Customer",
    "isRequired": true,
    "createdAt": "2025-10-27T00:00:00Z"
  },
  {
    "id": 2,
    "templateId": 1,
    "key": "EMAIL",
    "type": "string",
    "fallbackValue": null,
    "isRequired": true,
    "createdAt": "2025-10-27T00:00:00Z"
  },
  {
    "id": 3,
    "templateId": 1,
    "key": "VERIFICATION_CODE",
    "type": "string",
    "fallbackValue": "000000",
    "isRequired": false,
    "createdAt": "2025-10-27T00:00:00Z"
  }
]
```

**Usage**:
- Seeded into test database via test setup utilities
- Used to verify API responses include correct variable metadata
- Enables testing of variable detection and management workflows

#### 2.3 API Request/Response Fixtures

**Location**: `tests/api/fixtures/template-payloads.json`
**Schema**: Collection of API test scenarios

```typescript
interface APITestScenario {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  requestBody?: Record<string, any>;
  expectedStatus: number;
  expectedResponse?: Record<string, any>;
  description: string;
}
```

**Example Fixtures**:
```json
{
  "createTemplateSuccess": {
    "method": "POST",
    "endpoint": "/api/templates",
    "requestBody": {
      "name": "welcome-email",
      "content": { /* Unlayer design */ }
    },
    "expectedStatus": 201,
    "expectedResponse": {
      "id": 1,
      "name": "welcome-email",
      "content": { /* ... */ },
      "createdAt": "ISO-8601-timestamp",
      "updatedAt": "ISO-8601-timestamp"
    }
  },
  "createTemplateInvalidName": {
    "method": "POST",
    "endpoint": "/api/templates",
    "requestBody": {
      "name": "",
      "content": {}
    },
    "expectedStatus": 400,
    "expectedResponse": {
      "error": "Template name is required"
    }
  }
}
```

### 3. Mock Service Configurations

**Purpose**: Replace external services with deterministic mock implementations

#### 3.1 Unlayer API Mock

**Location**: `tests/mocks/unlayer.ts`

```typescript
export interface MockUnlayerAPI {
  validateDesign(design: unknown): { valid: boolean; errors?: string[] };
  exportHtml(design: unknown): string;
  parseDesign(json: string): UnlayerDesign;
}
```

**Mock Implementation**:
```typescript
export const createUnlayerMock = (): MockUnlayerAPI => ({
  validateDesign: (design) => {
    try {
      const isValid = isValidUnlayerDesign(design);
      return { valid: isValid };
    } catch (e) {
      return { valid: false, errors: ['Invalid design structure'] };
    }
  },
  exportHtml: (design) => {
    // Return template HTML with merge tags intact
    return '<html><body>{{NAME}} email content</body></html>';
  },
  parseDesign: (json) => JSON.parse(json) as UnlayerDesign,
});
```

**Mock Configuration in Setup**:
```typescript
// tests/setup.ts
import { vi } from 'vitest';
import { createUnlayerMock } from './mocks/unlayer';

vi.mock('@/lib/sdk/unlayer-api', () => createUnlayerMock());
```

**Usage**:
- Unit tests: Fast, deterministic behavior without external API calls
- Integration tests: Mock prevents quota usage and network dependency
- E2E tests: Optional real API with test project ID (can fall back to mock)

#### 3.2 Database Mock (Test Database)

**Location**: `tests/db-setup.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function setupTestDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  // Run migrations to schema version
  await runMigrations(client);
  
  return { db, client };
}

export async function resetDatabase(db: Database) {
  // Strategy 1: Transaction rollback (within test)
  // Strategy 2: Truncate all tables
  await db.execute(sql`TRUNCATE TABLE postcraft_template_variables CASCADE`);
  await db.execute(sql`TRUNCATE TABLE postcraft_templates`);
}
```

**Test Isolation Pattern**:
```typescript
describe('Template API', () => {
  let db: Database;
  
  beforeEach(async () => {
    const { db: testDb } = await setupTestDatabase();
    db = testDb;
    // Each test gets clean slate
  });
  
  afterEach(async () => {
    await resetDatabase(db);
  });
  
  test('creates template', async () => {
    // Test uses clean database
  });
});
```

## Test Coverage Model

**Purpose**: Track which code paths are exercised by tests

### Coverage Thresholds (per specification)

```typescript
{
  coverage: {
    lines: 70,      // Overall: 70%
    functions: 70,  // 70% of functions tested
    branches: 70,   // 70% of conditional branches
    statements: 70  // 70% of statements
  }
}
```

**Target by Component Type**:
- **Utility functions** (validation, variable-detection): 80%+ (high priority)
- **API routes**: 75%+ (important for reliability)
- **Components**: 60%+ (lower ROI for UI testing)
- **SDK/core**: 85%+ (critical path)

### Coverage Report Structure

**Generated Artifacts**:
```
coverage/
├── coverage-final.json      # Machine-readable coverage data
├── index.html               # Interactive HTML report
├── lib/
│   └── utils/
│       ├── validation.ts.html
│       ├── variable-detection.ts.html
│       └── unlayer-validation.ts.html
└── summary.txt              # Text summary for CI/CD
```

**Coverage Report Contents**:
- Statement coverage: Which lines of code executed
- Branch coverage: Which if/else paths executed
- Function coverage: Which functions called during tests
- Line coverage: Which lines executed
- Untested files highlighted for review

## State Transitions

### Test Database Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ Test Setup (beforeAll/beforeEach)                       │
├─────────────────────────────────────────────────────────┤
│ 1. Connect to TEST_DATABASE_URL                         │
│ 2. Run pending migrations (if any)                      │
│ 3. Seed fixtures (optional)                             │
│ 4. Begin transaction or prepare for isolation           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Test Execution                                          │
├─────────────────────────────────────────────────────────┤
│ - Read/write to isolated database state                 │
│ - Verify query results and side effects                │
│ - Assert database state changes                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Test Cleanup (afterEach/afterAll)                       │
├─────────────────────────────────────────────────────────┤
│ 1. Rollback transaction OR truncate tables              │
│ 2. Close database connections                          │
│ 3. Verify clean state for next test                    │
└─────────────────────────────────────────────────────────┘
```

### E2E Test State Management

```
┌─────────────────────────────────────────────────────────┐
│ E2E Test Setup                                          │
├─────────────────────────────────────────────────────────┤
│ 1. Reset test database (clean state)                   │
│ 2. Seed fixtures if needed                             │
│ 3. Start/navigate to application                       │
│ 4. Clear browser cache/cookies (if needed)             │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ E2E Test Execution                                      │
├─────────────────────────────────────────────────────────┤
│ - User interactions (click, type, navigate)             │
│ - UI state assertions (element visible, content)        │
│ - Database queries to verify persistence               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ E2E Test Cleanup                                        │
├─────────────────────────────────────────────────────────┤
│ 1. Screenshot on failure (for debugging)                │
│ 2. Close browser/playwright context                     │
│ 3. Database reset for next test                        │
└─────────────────────────────────────────────────────────┘
```

## Relationships & Constraints

### Test Data Integrity

**Validation Rules Enforced**:
- Template name unique constraint: Prevents duplicate template names in tests
- Template ID reference: All template_variables must reference valid template
- Cascade delete: Deleting template removes all associated variables
- Required fields: name, content must be present; validated before insert

**Test Scenarios Covering Constraints**:
- Duplicate name insert → Should fail with unique constraint error
- Delete template → Should cascade delete variables
- Invalid template ID → Should fail foreign key constraint
- Null name/content → Should fail NOT NULL constraint

### Mock Service Dependencies

**Mocking Strategy**:
- `vi.mock()` used for internal modules (Unlayer API, database queries)
- MSW (Mock Service Worker) optional for external HTTP endpoints
- Real PostgreSQL for integration tests (not mocked)
- Browser automation (Playwright) for E2E tests (real Next.js server)

**Dependency Graph**:
```
Unit Tests
  ├─ validation.test.ts
  │   └─ Mock: None (pure functions)
  ├─ variable-detection.test.ts
  │   └─ Mock: None (pure functions)
  └─ unlayer-validation.test.ts
      └─ Mock: None (type guards + parsing)

Integration Tests
  ├─ templates.integration.test.ts
  │   └─ Mock: Test Database (real), No HTTP mocks
  └─ template-variables.integration.test.ts
      └─ Mock: Test Database (real), No HTTP mocks

API Tests
  ├─ templates.api.test.ts
  │   └─ Mock: Test Database (real), Unlayer API (vi.mock)
  
E2E Tests
  ├─ template-crud.spec.ts
  │   └─ Mock: Test Database (real), Real Browser (Playwright)
  └─ template-import.spec.ts
      └─ Mock: Test Database (real), Real Browser
```

## Data Validation Rules

### Template Validation (from schema)
- **name**: string, NOT NULL, UNIQUE
- **content**: jsonb, NOT NULL, must be valid Unlayer design
- **html**: text, nullable, production HTML with merge tags
- **created_at**: timestamp, default NOW()
- **updated_at**: timestamp, default NOW()

### Variable Validation (from schema)
- **key**: string, NOT NULL, uppercase letters and underscores
- **type**: string, NOT NULL, one of: 'string', 'number', 'boolean', 'date'
- **fallbackValue**: text, nullable
- **isRequired**: boolean, default false
- **templateId**: integer, NOT NULL, foreign key to templates
- **Composite unique**: (templateId, key) must be unique

## Summary

The testing infrastructure introduces no new application entities but establishes a comprehensive data model for:
1. **Test fixtures**: Sample templates, variables, and payloads
2. **Mock services**: Unlayer API, database operations
3. **Test database**: Isolated PostgreSQL instance with same schema
4. **Coverage reporting**: Metrics and thresholds for code quality

All test data models are derived from or aligned with the production schema defined in `lib/db/schema.ts`, ensuring test scenarios are realistic and applicable to production use.
