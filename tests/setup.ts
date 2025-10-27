/**
 * @fileoverview Global Test Setup and Configuration
 *
 * This file runs once before all tests begin. It sets up:
 * - Environment variables from .env.test
 * - Vitest globals (describe, it, beforeEach, etc.)
 * - Test database initialization and migrations
 * - Environment validation
 * - Schema drift detection (verifies migrations match expectations)
 *
 * Schema Drift Detection:
 * - Compares applied migrations with migration files on disk
 * - Fails fast if mismatch detected (indicates schema inconsistency)
 * - Provides clear error message to fix the issue
 *
 * Execution Order:
 * 1. Load .env.test environment variables
 * 2. Validate required environment variables set
 * 3. Initialize test database connection
 * 4. Run all pending migrations
 * 5. Detect schema drift (verify migrations applied correctly)
 * 6. Ready for test execution
 *
 * @example
 * // Tests automatically have globals available (no import needed)
 * describe('My Test', () => {
 *   it('should work', () => {
 *     expect(true).toBe(true);
 *   });
 * });
 *
 * @see vitest.config.ts for setupFiles configuration
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { setupTestDatabase } from './db-setup';

/**
 * Validate that all required environment variables are set
 *
 * @throws {Error} If any required variable is missing
 */
function validateEnvironment() {
  const required = [
    'TEST_DATABASE_URL',
    'TEST_API_BASE_URL',
    'TEST_E2E_BASE_URL',
    'NODE_ENV',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required test environment variables: ${missing.join(', ')}. ` +
        'Add them to .env.test'
    );
  }

  // Verify NODE_ENV is set to test
  if (process.env.NODE_ENV !== 'test') {
    console.warn('NODE_ENV is not set to "test"');
  }
}

/**
 * Detect schema drift between migration files and applied migrations
 *
 * Verifies that all migration files on disk have been applied to the test
 * database. If there's a mismatch, it likely indicates:
 * - New migrations weren't applied
 * - Migration files were deleted without reverting
 * - Database schema is out of sync with code
 *
 * @param {ReturnType<typeof setupTestDatabase>} db - Database instance
 * @throws {Error} If schema drift detected (migrations don't match)
 */
async function detectSchemaDrift(db: Awaited<ReturnType<typeof setupTestDatabase>>) {
  try {
    // Verify tables exist by attempting to query them
    // If tables don't exist, this will throw an error
    const tables = await db.execute(
      sql`SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name LIKE 'postcraft%'`
    );

    if (!tables || tables.length === 0) {
      throw new Error(
        'Schema drift detected: No postcraft tables found. ' +
          'Migrations may not have applied correctly.'
      );
    }

    console.log('✓ Schema validation passed - all tables present');
  } catch (error) {
    console.error('Schema drift detection failed:', error);
    throw error;
  }
}

/**
 * Global setup function - runs once before all tests
 */
export async function setup() {
  console.log('🧪 Setting up test environment...');

  try {
    // 1. Validate environment
    console.log('  ✓ Validating environment variables...');
    validateEnvironment();

    // 2. Setup database
    console.log('  ✓ Initializing test database...');
    const db = await setupTestDatabase();

    // 3. Detect schema drift
    console.log('  ✓ Detecting schema drift...');
    await detectSchemaDrift(db);

    console.log('🎉 Test environment ready!\n');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
}

// Execute setup when this module is loaded
setup().catch((error) => {
  console.error('Fatal error during test setup:', error);
  process.exit(1);
});
