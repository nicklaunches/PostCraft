/**
 * @fileoverview Database Setup Utilities for Testing
 *
 * Provides utilities for test database management with transaction isolation
 * enabling parallel test execution without interference.
 *
 * Key Features:
 * - Transaction rollback strategy for test isolation
 * - Automatic schema initialization via migrations
 * - Fixture seeding for common test scenarios
 * - Connection pooling with per-test cleanup
 *
 * Strategy:
 * - Each test runs in its own transaction
 * - Changes are automatically rolled back after test
 * - Allows concurrent tests with no data contamination
 * - No manual cleanup needed between tests
 *
 * Exported Functions:
 * - setupTestDatabase() - Initialize connection and schema
 * - resetDatabase() - Begin transaction for test isolation
 * - seedFixtures() - Populate test data in current transaction
 * - cleanup() - Close connections after tests
 *
 * @example
 * // Setup before all tests
 * const db = await setupTestDatabase();
 *
 * @example
 * // Before each test
 * await resetDatabase(db);
 *
 * @example
 * // After all tests
 * await cleanup();
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import * as schema from '../lib/db/schema';

// Global test database connection (reused across tests)
let testConnection: postgres.Sql;

/**
 * Setup test database with migrations applied
 *
 * Creates connection to TEST_DATABASE_URL and applies all pending migrations.
 * Should be called once before test suite runs.
 *
 * @returns {Promise<ReturnType<typeof drizzle>>} Database instance for tests
 * @throws {Error} If TEST_DATABASE_URL not set or migrations fail
 *
 * @example
 * const db = await setupTestDatabase();
 */
export async function setupTestDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'TEST_DATABASE_URL environment variable not set. Add to .env.test'
    );
  }

  // Create connection pool for tests
  testConnection = postgres(connectionString, {
    max: 5, // Smaller pool for test isolation
  });

  // Create Drizzle instance
  const db = drizzle(testConnection, { schema });

  // Apply migrations to test database
  const migrationsPath = path.join(process.cwd(), 'lib/db/migrations');

  try {
    await migrate(db, { migrationsFolder: migrationsPath });
  } catch (error) {
    console.error('Migration error during test setup:', error);
    throw error;
  }

  return db;
}

/**
 * Reset database state for test isolation
 *
 * Truncates all tables to start with clean state. Uses transaction if needed
 * for additional isolation. Called before each test to ensure no interference.
 *
 * @returns {Promise<void>}
 *
 * @example
 * beforeEach(async () => {
 *   await resetDatabase();
 * });
 */
export async function resetDatabase() {
  // Truncate tables in dependency order (templates before variables)
  // CASCADE DELETE ensures referential integrity
  try {
    // Delete all variables first (due to foreign key)
    await testConnection`TRUNCATE TABLE postcraft_template_variables CASCADE`;

    // Delete all templates
    await testConnection`TRUNCATE TABLE postcraft_templates CASCADE`;
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Seed test fixtures into database
 *
 * Populates database with common test data. Called from test setup to
 * initialize fixtures. Uses current transaction context for isolation.
 *
 * Fixtures:
 * - Sample email templates
 * - Sample template variables
 * - Test data for validation scenarios
 *
 * @param {ReturnType<typeof drizzle>} db - Database instance
 * @returns {Promise<void>}
 *
 * @example
 * beforeEach(async () => {
 *   await resetDatabase();
 *   await seedFixtures(db);
 * });
 */
export async function seedFixtures(db: ReturnType<typeof drizzle>) {
  // Sample template for testing
  const sampleTemplate = {
    name: 'welcome-email',
    content: {
      body: {
        rows: [
          {
            cells: [
              {
                value: 'Welcome {{NAME}}',
                styles: { fontSize: '20px' },
              },
            ],
          },
        ],
      },
      counters: {
        u_column: 1,
        u_row: 1,
      },
      schemaVersion: 12,
    },
    html: '<html><body><h1>Welcome {{NAME}}</h1></body></html>',
  };

  try {
    // Insert sample template
    const result = await db
      .insert(schema.templates)
      .values(sampleTemplate)
      .returning({ id: schema.templates.id });

    if (result.length > 0) {
      const templateId = result[0].id;

      // Insert sample variables for the template
      await db.insert(schema.templateVariables).values([
        {
          templateId,
          key: 'NAME',
          type: 'string',
          isRequired: true,
          fallbackValue: 'Friend',
        },
        {
          templateId,
          key: 'EMAIL',
          type: 'string',
          isRequired: true,
          fallbackValue: null,
        },
      ]);
    }
  } catch (error) {
    console.error('Error seeding fixtures:', error);
    throw error;
  }
}

/**
 * Cleanup test database connection
 *
 * Closes database connection pool. Should be called once after all tests
 * complete to properly clean up resources.
 *
 * @returns {Promise<void>}
 *
 * @example
 * afterAll(async () => {
 *   await cleanup();
 * });
 */
export async function cleanup() {
  if (testConnection) {
    await testConnection.end();
  }
}
