/**
 * @fileoverview Database client configuration for PostCraft
 *
 * Initializes a Drizzle ORM instance connected to PostgreSQL via the
 * postgres-js driver. Provides a type-safe database client with connection
 * pooling for all data access across the PostCraft studio and SDK.
 *
 * Connection Details:
 * - Driver: postgres-js (PostgreSQL native protocol)
 * - Pool size: 10 connections (configurable via max option)
 * - Config source: POSTCRAFT_DATABASE_URL environment variable
 * - Schema: Imported from lib/db/schema.ts for type inference
 *
 * Usage:
 * - Imported by all routes and utilities requiring database access
 * - Provides type-safe query building via Drizzle ORM
 * - Connection pooling handled automatically by postgres-js
 *
 * @throws {Error} If POSTCRAFT_DATABASE_URL environment variable is not set
 *
 * @example
 * // Query templates
 * const templates = await db.select().from(templatesTable);
 *
 * @example
 * // Insert and return result
 * const newTemplate = await db
 *   .insert(templatesTable)
 *   .values({ name: 'newsletter', content: {...} })
 *   .returning();
 *
 * @see {@link https://orm.drizzle.team/docs/get-started-postgresql} Drizzle PostgreSQL setup
 * @see {@link https://github.com/porsager/postgres} postgres-js documentation
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use TEST_DATABASE_URL for tests, POSTCRAFT_DATABASE_URL for production
const connectionString = process.env.TEST_DATABASE_URL || process.env.POSTCRAFT_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Database configuration missing. Set either TEST_DATABASE_URL (for tests) or POSTCRAFT_DATABASE_URL (for production)."
  );
}

// Create the connection pool
const client = postgres(connectionString, {
  max: 10, // connection pool size
});

// Create the Drizzle ORM instance
export const db = drizzle(client, { schema });

export type DB = typeof db;

