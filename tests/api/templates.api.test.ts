/**
 * @fileoverview API endpoint tests for template CRUD operations
 *
 * Tests all HTTP endpoints for template management:
 * - GET /api/templates - List templates with pagination
 * - POST /api/templates - Create new template
 * - GET /api/templates/[id] - Retrieve single template with variables
 * - PUT /api/templates/[id] - Update template content and variables
 * - DELETE /api/templates/[id] - Delete template with cascade delete
 *
 * Test Strategy:
 * - Unit-level tests that don't require UI or browser
 * - Uses test API base URL from .env.test
 * - Validates request/response contracts
 * - Tests error handling and validation
 * - Tests transaction atomicity and cascade delete
 *
 * Fixtures:
 * - Valid payloads: createMinimal, createWithVariables, updateMinimal, etc.
 * - Invalid payloads: missingName, invalidType, etc.
 *
 * @see tests/api/fixtures/template-payloads.json - Test data
 * @see app/api/templates/route.ts - GET/POST implementations
 * @see app/api/templates/[id]/route.ts - GET/PUT/DELETE implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { templates, templateVariables } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { resetDatabase } from '../db-setup';
import payloads from './fixtures/template-payloads.json';

// Use the test API base URL from environment
const API_BASE = process.env.TEST_API_BASE_URL || 'http://localhost:3000';

/**
 * Helper to make API calls with error handling
 */
async function apiCall(
  method: string,
  path: string,
  body?: any
): Promise<{ status: number; data: any }> {
  const url = `${API_BASE}/api${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    throw new Error(
      `API call failed: ${method} ${path}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Helper to create a template in the database for testing
 */
async function createTestTemplate(overrides?: Partial<typeof templates.$inferInsert>) {
  const template = {
    name: `test-template-${Date.now()}`,
    content: {
      body: { rows: [] },
      counters: { u_column: 0, u_row: 0 },
      schemaVersion: 12,
    },
    ...overrides,
  };

  const result = await db
    .insert(templates)
    .values(template)
    .returning();

  return result[0];
}

/**
 * Helper to create template variables
 */
async function createTestVariable(
  templateId: number,
  key: string,
  type = 'string',
  fallbackValue: string | null = null,
  isRequired = false
) {
  const result = await db
    .insert(templateVariables)
    .values({
      templateId,
      key,
      type,
      fallbackValue,
      isRequired,
    })
    .returning();

  return result[0];
}

// ============================================================================
// GET /api/templates - List Templates with Pagination
// ============================================================================

describe('GET /api/templates', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Success Cases', () => {
    it('returns empty list when no templates exist', async () => {
      const { status, data } = await apiCall('GET', '/templates');

      expect(status).toBe(200);
      expect(data.items).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalPages: 0,
        totalCount: 0,
      });
    });

    it('returns templates paginated by default (20 per page)', async () => {
      // Create 25 templates
      for (let i = 0; i < 25; i++) {
        await createTestTemplate({
          name: `template-${String(i).padStart(3, '0')}`,
        });
      }

      const { status, data } = await apiCall('GET', '/templates');

      expect(status).toBe(200);
      expect(data.items.length).toBe(20);
      expect(data.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalPages: 2,
        totalCount: 25,
      });
    });

    it('returns correct page with custom pageSize', async () => {
      // Create 15 templates
      for (let i = 0; i < 15; i++) {
        await createTestTemplate({
          name: `template-${String(i).padStart(3, '0')}`,
        });
      }

      const { status, data } = await apiCall('GET', '/templates?pageSize=5');

      expect(status).toBe(200);
      expect(data.items.length).toBe(5);
      expect(data.pagination).toEqual({
        page: 1,
        pageSize: 5,
        totalPages: 3,
        totalCount: 15,
      });
    });

    it('returns correct page when navigating pages', async () => {
      // Create 30 templates
      for (let i = 0; i < 30; i++) {
        await createTestTemplate({
          name: `template-${String(i).padStart(3, '0')}`,
        });
      }

      const { status, data } = await apiCall(
        'GET',
        '/templates?page=2&pageSize=10'
      );

      expect(status).toBe(200);
      expect(data.items.length).toBe(10);
      expect(data.pagination).toEqual({
        page: 2,
        pageSize: 10,
        totalPages: 3,
        totalCount: 30,
      });
    });

    it('returns templates sorted by most recent first', async () => {
      // Create templates with controlled timing
      const template1 = await createTestTemplate({ name: 'oldest' });
      await new Promise((r) => setTimeout(r, 10)); // Small delay
      const template2 = await createTestTemplate({ name: 'newest' });

      const { status, data } = await apiCall('GET', '/templates');

      expect(status).toBe(200);
      expect(data.items.length).toBe(2);
      // Newest should be first
      expect(data.items[0].id).toBe(template2.id);
      expect(data.items[1].id).toBe(template1.id);
    });

    it('returns complete template object with all fields', async () => {
      await createTestTemplate({
        name: 'complete-template',
        html: '<html><body>Test</body></html>',
      });

      const { status, data } = await apiCall('GET', '/templates');

      expect(status).toBe(200);
      expect(data.items[0]).toHaveProperty('id');
      expect(data.items[0]).toHaveProperty('name');
      expect(data.items[0]).toHaveProperty('content');
      expect(data.items[0]).toHaveProperty('html');
      expect(data.items[0]).toHaveProperty('createdAt');
      expect(data.items[0]).toHaveProperty('updatedAt');
    });
  });

  describe('Validation Errors', () => {
    it('returns 400 with invalid page parameter', async () => {
      const { status, data } = await apiCall('GET', '/templates?page=invalid');

      expect(status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).toContain('page');
    });

    it('returns 400 with negative page parameter', async () => {
      const { status, data } = await apiCall('GET', '/templates?page=-1');

      expect(status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('returns 400 with invalid pageSize parameter', async () => {
      const { status, data } = await apiCall('GET', '/templates?pageSize=invalid');

      expect(status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error).toContain('pageSize');
    });

    it('returns 400 with pageSize > 100', async () => {
      const { status, data } = await apiCall('GET', '/templates?pageSize=101');

      expect(status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('clamps pageSize to maximum 100', async () => {
      // Create 150 templates
      for (let i = 0; i < 150; i++) {
        await createTestTemplate({
          name: `template-${String(i).padStart(3, '0')}`,
        });
      }

      // Request with large pageSize should be clamped
      const { status, data } = await apiCall('GET', '/templates?pageSize=200');

      expect(status).toBe(200);
      expect(data.items.length).toBe(100); // Clamped to 100
    });

    it('defaults to page=1 when not specified', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestTemplate({ name: `template-${i}` });
      }

      const { status, data } = await apiCall('GET', '/templates?pageSize=2');

      expect(status).toBe(200);
      expect(data.pagination.page).toBe(1);
    });

    it('defaults to pageSize=20 when not specified', async () => {
      for (let i = 0; i < 25; i++) {
        await createTestTemplate({ name: `template-${i}` });
      }

      const { status, data } = await apiCall('GET', '/templates');

      expect(status).toBe(200);
      expect(data.pagination.pageSize).toBe(20);
    });
  });
});

// ============================================================================
// POST /api/templates - Create Template
// ============================================================================

describe('POST /api/templates', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Success Cases', () => {
    it('creates template with minimal fields', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.valid.createMinimal
      );

      expect(status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe(payloads.valid.createMinimal.name);
      expect(data.content).toEqual(payloads.valid.createMinimal.content);
      expect(data.variables).toEqual([]);
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('creates template with variables', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.valid.createWithVariables
      );

      expect(status).toBe(201);
      expect(data.variables.length).toBe(2);
      expect(data.variables[0]).toEqual(
        expect.objectContaining({
          key: 'USER_NAME',
          type: 'string',
          fallbackValue: 'User',
          isRequired: false,
        })
      );
      expect(data.variables[1]).toEqual(
        expect.objectContaining({
          key: 'VERIFICATION_CODE',
          type: 'string',
          fallbackValue: null,
          isRequired: true,
        })
      );
    });

    it('creates template with HTML field', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.valid.createWithHtml
      );

      expect(status).toBe(201);
      expect(data.html).toBe(payloads.valid.createWithHtml.html);
    });

    it('creates template with multiple variable types', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.valid.createWithMultipleTypes
      );

      expect(status).toBe(201);
      expect(data.variables.length).toBe(4);

      const types = data.variables.map((v: any) => v.type);
      expect(types).toContain('string');
      expect(types).toContain('number');
      expect(types).toContain('date');
      expect(types).toContain('boolean');
    });

    it('persists template to database', async () => {
      const payload = payloads.valid.createMinimal;
      const { status, data } = await apiCall('POST', '/templates', payload);

      expect(status).toBe(201);

      // Verify it exists in database
      const dbTemplate = await db.query.templates.findFirst({
        where: eq(templates.id, data.id),
      });

      expect(dbTemplate).toBeDefined();
      expect(dbTemplate?.name).toBe(payload.name);
    });

    it('persists variables to database', async () => {
      const payload = payloads.valid.createWithVariables;
      const { status, data } = await apiCall('POST', '/templates', payload);

      expect(status).toBe(201);

      // Verify variables exist in database
      const dbVars = await db
        .select()
        .from(templateVariables)
        .where(eq(templateVariables.templateId, data.id));

      expect(dbVars.length).toBe(2);
      expect(dbVars.map((v) => v.key)).toContain('USER_NAME');
      expect(dbVars.map((v) => v.key)).toContain('VERIFICATION_CODE');
    });
  });

  describe('Validation Errors', () => {
    it('returns 400 with missing name', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createMissingName
      );

      expect(status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 with missing content', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createMissingContent
      );

      expect(status).toBe(400);
      expect(data.error).toContain('content');
    });

    it('returns 400 with empty name', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createEmptyName
      );

      expect(status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 with whitespace-only name', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createWhitespaceOnlyName
      );

      expect(status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 with name exceeding 100 characters', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createNameTooLong
      );

      expect(status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 with invalid characters in name', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createNameWithInvalidCharacters
      );

      expect(status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 with name not string', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createNameNotString
      );

      expect(status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 with content not object', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createContentNotObject
      );

      expect(status).toBe(400);
      expect(data.error).toContain('content');
    });

    it('returns 400 with content null', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createContentNull
      );

      expect(status).toBe(400);
      expect(data.error).toContain('content');
    });

    it('returns 400 with variables not array', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesNotArray
      );

      expect(status).toBe(400);
      expect(data.error).toContain('variables');
    });

    it('returns 400 with missing variable key', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesMissingKey
      );

      expect(status).toBe(400);
      expect(data.error).toContain('key');
    });

    it('returns 400 with invalid variable key format', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesKeyInvalidFormat
      );

      expect(status).toBe(400);
      expect(data.error).toContain('key');
    });

    it('returns 400 with variable key not string', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesKeyNotString
      );

      expect(status).toBe(400);
      expect(data.error).toContain('key');
    });

    it('returns 400 with missing variable type', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesMissingType
      );

      expect(status).toBe(400);
      expect(data.error).toContain('type');
    });

    it('returns 400 with invalid variable type', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesInvalidType
      );

      expect(status).toBe(400);
      expect(data.error).toContain('type');
    });

    it('returns 400 with invalid fallback value type', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesInvalidFallbackValue
      );

      expect(status).toBe(400);
      expect(data.error).toContain('fallbackValue');
    });

    it('returns 400 with required variable having fallback value', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createVariablesRequiredWithFallback
      );

      expect(status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('returns 400 with html not string', async () => {
      const { status, data } = await apiCall(
        'POST',
        '/templates',
        payloads.invalid.createHtmlNotString
      );

      expect(status).toBe(400);
      expect(data.error).toContain('html');
    });

    it('returns 409 when template name already exists', async () => {
      // Create first template
      const payload = payloads.valid.createMinimal;
      await apiCall('POST', '/templates', payload);

      // Try to create duplicate
      const { status, data } = await apiCall('POST', '/templates', payload);

      expect(status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });

  describe('Transaction Atomicity', () => {
    it('rolls back both template and variables on variable insert failure', async () => {
      // Create payload with valid template but invalid variable (in second position to pass initial validation)
      const payload = {
        name: `unique-template-${Date.now()}`,
        content: {
          body: { rows: [] },
          counters: { u_column: 0, u_row: 0 },
          schemaVersion: 12,
        },
        variables: [
          {
            key: 'VALID_VAR',
            type: 'string',
            fallbackValue: null,
            isRequired: false,
          },
          {
            key: 'INVALID_VAR',
            type: 'invalid_type', // Invalid
            fallbackValue: null,
            isRequired: false,
          },
        ],
      };

      const { status } = await apiCall('POST', '/templates', payload);

      expect(status).toBe(400);

      // Verify template was NOT created
      const dbTemplate = await db.query.templates.findFirst({
        where: eq(templates.name, payload.name),
      });

      expect(dbTemplate).toBeUndefined();
    });
  });
});

// ============================================================================
// GET /api/templates/[id] - Retrieve Single Template
// ============================================================================

describe('GET /api/templates/[id]', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Success Cases', () => {
    it('returns template by id', async () => {
      const created = await createTestTemplate({ name: 'get-test' });

      const { status, data } = await apiCall('GET', `/templates/${created.id}`);

      expect(status).toBe(200);
      expect(data.template.id).toBe(created.id);
      expect(data.template.name).toBe('get-test');
    });

    it('returns template with all fields', async () => {
      const created = await createTestTemplate({
        name: 'complete-template',
        html: '<html><body>Test</body></html>',
      });

      const { status, data } = await apiCall('GET', `/templates/${created.id}`);

      expect(status).toBe(200);
      expect(data.template).toHaveProperty('id');
      expect(data.template).toHaveProperty('name');
      expect(data.template).toHaveProperty('content');
      expect(data.template).toHaveProperty('html');
      expect(data.template).toHaveProperty('createdAt');
      expect(data.template).toHaveProperty('updatedAt');
      expect(data.template).toHaveProperty('variables');
    });

    it('returns template with associated variables', async () => {
      const template = await createTestTemplate({ name: 'with-vars' });
      await createTestVariable(template.id, 'USER_NAME', 'string', 'User', false);
      await createTestVariable(template.id, 'CODE', 'string', null, true);

      const { status, data } = await apiCall('GET', `/templates/${template.id}`);

      expect(status).toBe(200);
      expect(data.template.variables.length).toBe(2);
      expect(data.template.variables[0].key).toBe('USER_NAME');
      expect(data.template.variables[1].key).toBe('CODE');
    });

    it('returns template with no variables', async () => {
      const template = await createTestTemplate({ name: 'no-vars' });

      const { status, data } = await apiCall('GET', `/templates/${template.id}`);

      expect(status).toBe(200);
      expect(data.template.variables).toEqual([]);
    });
  });

  describe('Error Cases', () => {
    it('returns 404 when template not found', async () => {
      const { status, data } = await apiCall('GET', '/templates/99999');

      expect(status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('returns 400 with invalid template id', async () => {
      const { status, data } = await apiCall('GET', '/templates/invalid');

      expect(status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    it('returns 400 with non-numeric template id', async () => {
      const { status, data } = await apiCall('GET', '/templates/abc123');

      expect(status).toBe(400);
      expect(data.error).toContain('Invalid');
    });
  });
});

// ============================================================================
// PUT /api/templates/[id] - Update Template
// ============================================================================

describe('PUT /api/templates/[id]', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Success Cases', () => {
    it('updates template content', async () => {
      const template = await createTestTemplate({ name: 'to-update' });

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.valid.updateMinimal
      );

      expect(status).toBe(200);
      expect(data.template.id).toBe(template.id);
      expect(data.template.content).toEqual(
        payloads.valid.updateMinimal.content
      );
    });

    it('updates template with new variables', async () => {
      const template = await createTestTemplate({ name: 'update-vars' });

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.valid.updateWithVariables
      );

      expect(status).toBe(200);
      expect(data.template.variables.length).toBe(2);
      expect(data.template.variables.map((v: any) => v.key)).toContain(
        'NEW_USER'
      );
      expect(data.template.variables.map((v: any) => v.key)).toContain(
        'DISCOUNT'
      );
    });

    it('replaces existing variables on update', async () => {
      const template = await createTestTemplate({ name: 'replace-vars' });
      await createTestVariable(template.id, 'OLD_VAR', 'string');

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.valid.updateWithVariables
      );

      expect(status).toBe(200);
      // Old variable should be gone
      expect(data.template.variables.map((v: any) => v.key)).not.toContain(
        'OLD_VAR'
      );
      // New variables should be present
      expect(data.template.variables.map((v: any) => v.key)).toContain(
        'NEW_USER'
      );
    });

    it('clears all variables when updating with empty variables array', async () => {
      const template = await createTestTemplate({ name: 'clear-vars' });
      await createTestVariable(template.id, 'VAR1', 'string');
      await createTestVariable(template.id, 'VAR2', 'string');

      const { status, data } = await apiCall('PUT', `/templates/${template.id}`, {
        content: {
          body: { rows: [] },
          counters: { u_column: 0, u_row: 0 },
          schemaVersion: 12,
        },
        variables: [],
      });

      expect(status).toBe(200);
      expect(data.template.variables.length).toBe(0);
    });

    it('updates HTML field', async () => {
      const template = await createTestTemplate({ name: 'update-html' });

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.valid.updateWithHtml
      );

      expect(status).toBe(200);
      expect(data.template.html).toBe(payloads.valid.updateWithHtml.html);
    });

    it('updates updatedAt timestamp', async () => {
      const template = await createTestTemplate({ name: 'update-time' });
      const originalTime = new Date(template.updatedAt);

      await new Promise((r) => setTimeout(r, 10)); // Ensure time difference

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.valid.updateMinimal
      );

      expect(status).toBe(200);
      const newTime = new Date(data.template.updatedAt);
      expect(newTime.getTime()).toBeGreaterThan(originalTime.getTime());
    });

    it('persists changes to database', async () => {
      const template = await createTestTemplate({ name: 'persist-update' });

      const { status } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.valid.updateWithVariables
      );

      expect(status).toBe(200);

      // Verify in database
      const updated = await db.query.templates.findFirst({
        where: eq(templates.id, template.id),
        with: { variables: true },
      });

      expect(updated?.variables.length).toBe(2);
      expect(updated?.variables.map((v) => v.key)).toContain('NEW_USER');
    });
  });

  describe('Validation Errors', () => {
    it('returns 400 with missing content', async () => {
      const template = await createTestTemplate({ name: 'missing-content' });

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.invalid.updateMissingContent
      );

      expect(status).toBe(400);
      expect(data.error).toContain('content');
    });

    it('returns 400 with content not object', async () => {
      const template = await createTestTemplate({ name: 'content-not-obj' });

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.invalid.updateContentNotObject
      );

      expect(status).toBe(400);
      expect(data.error).toContain('content');
    });

    it('returns 400 with content null', async () => {
      const template = await createTestTemplate({ name: 'content-null' });

      const { status, data } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        payloads.invalid.updateContentNull
      );

      expect(status).toBe(400);
      expect(data.error).toContain('content');
    });

    it('returns 400 with invalid template id', async () => {
      const { status, data } = await apiCall(
        'PUT',
        '/templates/invalid',
        payloads.valid.updateMinimal
      );

      expect(status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    it('returns 404 when template not found', async () => {
      const { status, data } = await apiCall(
        'PUT',
        '/templates/99999',
        payloads.valid.updateMinimal
      );

      expect(status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('Transaction Atomicity', () => {
    it('rolls back content update if variable insert fails', async () => {
      const template = await createTestTemplate({
        name: 'rollback-test',
        content: {
          body: { rows: [{ cells: [{ value: 'Original' }] }] },
          counters: { u_column: 1, u_row: 1 },
          schemaVersion: 12,
        },
      });

      // Update with invalid variable
      const { status } = await apiCall(
        'PUT',
        `/templates/${template.id}`,
        {
          content: {
            body: { rows: [] },
            counters: { u_column: 0, u_row: 0 },
            schemaVersion: 12,
          },
          variables: [
            {
              key: 'INVALID_VAR',
              type: 'invalid_type',
              fallbackValue: null,
              isRequired: false,
            },
          ],
        }
      );

      expect(status).toBe(400);

      // Verify content was NOT updated
      const dbTemplate = await db.query.templates.findFirst({
        where: eq(templates.id, template.id),
      });

      expect((dbTemplate?.content as any)?.body?.rows?.[0]?.cells?.[0]?.value).toBe('Original');
    });
  });
});

// ============================================================================
// DELETE /api/templates/[id] - Delete Template
// ============================================================================

describe('DELETE /api/templates/[id]', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Success Cases', () => {
    it('deletes template', async () => {
      const template = await createTestTemplate({ name: 'to-delete' });

      const { status, data } = await apiCall(
        'DELETE',
        `/templates/${template.id}`
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');
    });

    it('removes template from database', async () => {
      const template = await createTestTemplate({ name: 'delete-verify' });

      await apiCall('DELETE', `/templates/${template.id}`);

      // Verify in database
      const deleted = await db.query.templates.findFirst({
        where: eq(templates.id, template.id),
      });

      expect(deleted).toBeUndefined();
    });

    it('cascade deletes associated variables', async () => {
      const template = await createTestTemplate({ name: 'cascade-delete' });
      await createTestVariable(template.id, 'VAR1', 'string');
      await createTestVariable(template.id, 'VAR2', 'string');

      const { status } = await apiCall(
        'DELETE',
        `/templates/${template.id}`
      );

      expect(status).toBe(200);

      // Verify variables are deleted
      const vars = await db
        .select()
        .from(templateVariables)
        .where(eq(templateVariables.templateId, template.id));

      expect(vars.length).toBe(0);
    });

    it('returns correct message with template name', async () => {
      const template = await createTestTemplate({
        name: 'named-template',
      });

      const { status, data } = await apiCall(
        'DELETE',
        `/templates/${template.id}`
      );

      expect(status).toBe(200);
      expect(data.message).toContain('named-template');
    });
  });

  describe('Error Cases', () => {
    it('returns 404 when template not found', async () => {
      const { status, data } = await apiCall('DELETE', '/templates/99999');

      expect(status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('returns 400 with invalid template id', async () => {
      const { status, data } = await apiCall('DELETE', '/templates/invalid');

      expect(status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    it('returns 400 with non-numeric id', async () => {
      const { status, data } = await apiCall('DELETE', '/templates/abc123');

      expect(status).toBe(400);
      expect(data.error).toContain('Invalid');
    });
  });
});
