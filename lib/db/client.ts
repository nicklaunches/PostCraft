import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTCRAFT_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "POSTCRAFT_DATABASE_URL environment variable is not set. Please configure your database connection."
  );
}

// Create the connection pool
const client = postgres(connectionString, {
  max: 10, // connection pool size
});

// Create the Drizzle ORM instance
export const db = drizzle(client, { schema });

export type DB = typeof db;
