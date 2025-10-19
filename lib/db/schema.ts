/**
 * @fileoverview Database schema for PostCraft email template studio
 *
 * Defines PostgreSQL tables and relationships for managing email templates
 * and their merge tag variables. Uses Drizzle ORM for type-safe schema definition
 * and query building.
 *
 * Tables:
 * - `templates`: Core email template data with design JSON and metadata
 * - `template_variables`: Merge tag metadata (type, fallback, required status)
 *
 * Relationships:
 * - One template has many variables (one-to-many)
 * - One variable belongs to one template (many-to-one)
 * - Cascade delete: Deleting a template removes all its variables
 *
 * Indexes:
 * - `templates_updated_at_idx`: Optimizes pagination queries (ORDER BY updated_at DESC)
 * - `template_variables_template_id_key_idx`: Prevents duplicate merge tags per template
 *
 * @see {@link https://orm.drizzle.team/docs/postgresql-core} Drizzle PostgreSQL documentation
 *
 * @example
 * // Query all templates with their variables
 * const templates = await db.query.templates.findMany({
 *   with: { variables: true }
 * });
 *
 * @example
 * // Create a new template with variables
 * const result = await db
 *   .insert(templates)
 *   .values({
 *     name: 'welcome-email',
 *     content: { /* react-email-editor design JSON * / }
 *   })
 *   .returning();
 */

import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const templates = pgTable(
  "templates",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(), // SDK lookup key
    content: jsonb("content").notNull(), // react-email-editor design JSON from saveDesign()
    html: text("html"), // Exported HTML from exportHtml() with merge tags
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Index for pagination ORDER BY updated_at DESC
    updatedAtIdx: index("templates_updated_at_idx").on(table.updatedAt),
  })
);

export const templateVariables = pgTable(
  "template_variables",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
      .references(() => templates.id, { onDelete: "cascade" })
      .notNull(),
    key: text("key").notNull(), // e.g., "NAME", "AGE"
    type: text("type").notNull(), // 'string' | 'number' | 'boolean' | 'date'
    fallbackValue: text("fallback_value"), // nullable
    isRequired: boolean("is_required").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique index: prevent duplicate variables per template
    templateIdKeyIdx: uniqueIndex(
      "template_variables_template_id_key_idx"
    ).on(table.templateId, table.key),
  })
);

// Drizzle relations for query API
export const templatesRelations = relations(templates, ({ many }) => ({
  variables: many(templateVariables),
}));

export const templateVariablesRelations = relations(
  templateVariables,
  ({ one }) => ({
    template: one(templates, {
      fields: [templateVariables.templateId],
      references: [templates.id],
    }),
  })
);

// TypeScript types inferred from schema
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateVariable = typeof templateVariables.$inferSelect;
export type NewTemplateVariable = typeof templateVariables.$inferInsert;
