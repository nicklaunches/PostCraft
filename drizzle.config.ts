import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTCRAFT_DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
} satisfies Config;
