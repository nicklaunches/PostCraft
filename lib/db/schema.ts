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
    // NOTE: html column REMOVED - generated on-demand via exportHtml() (FR-038)
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
