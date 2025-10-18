# Data Model: Local Studio Dashboard

**Branch**: `001-local-studio-dashboard` | **Date**: 2025-10-18

## Entity Relationship Diagram

```
┌─────────────────────────────┐
│       templates             │
├─────────────────────────────┤
│ id: SERIAL PK               │
│ name: TEXT UNIQUE NOT NULL  │◄──┐
│ content: JSONB NOT NULL     │   │
│ html: TEXT NOT NULL         │   │ ONE-TO-MANY
│ created_at: TIMESTAMP       │   │ (CASCADE DELETE)
│ updated_at: TIMESTAMP       │   │
└─────────────────────────────┘   │
                                  │
                                  │
┌─────────────────────────────┐   │
│   template_variables        │   │
├─────────────────────────────┤   │
│ id: SERIAL PK               │   │
│ template_id: INT FK ────────┼───┘
│ key: TEXT NOT NULL          │
│ type: TEXT NOT NULL         │
│ fallback_value: TEXT        │
│ is_required: BOOLEAN        │
│ created_at: TIMESTAMP       │
└─────────────────────────────┘

UNIQUE INDEX: (template_id, key)
```

---

## Entities

### 1. Template

**Description**: Represents an email template with visual design and rendered HTML output

**Database Table**: `templates`

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `name` | TEXT | NOT NULL, UNIQUE | Template name for SDK rendering and UI display (e.g., "welcome-email") |
| `content` | JSONB | NOT NULL | react-email-editor design JSON structure (stores drag-and-drop layout) |
| `html` | TEXT | NOT NULL | Rendered HTML with inline styles and merge tags (e.g., `{{NAME}}`) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Template creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp (updated on save) |

**Indexes**:
- Primary key index on `id` (automatic)
- Unique index on `name` for fast SDK lookups and duplicate prevention (FR-018)
- Index on `updated_at DESC` for efficient pagination ordering

**Validation Rules**:
- `name` must be 1-100 characters, alphanumeric with hyphens/underscores only (sanitized per FR-019)
- `name` uniqueness enforced at database level (prevents race conditions)
- `content` must be valid JSONB from react-email-editor export
- `html` must contain at least one HTML tag (basic validation)

**State Transitions**: N/A (templates are stateless; only CRUD operations)

**Relationships**:
- One-to-many with `template_variables` (cascade delete: deleting template removes all associated variables)

**Business Rules**:
- Template name cannot be changed after creation (requires new template with migration)
- Template deletion is permanent (no soft delete in this version)
- `updated_at` timestamp automatically updated on every save operation

---

### 2. Template Variable

**Description**: Represents a merge tag variable placeholder within an email template (e.g., `{{NAME}}`, `{{AGE}}`)

**Database Table**: `template_variables`

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `template_id` | INTEGER | NOT NULL, FOREIGN KEY → templates.id (CASCADE DELETE) | Reference to parent template |
| `key` | TEXT | NOT NULL | Merge tag name in uppercase (e.g., "NAME", "AGE") |
| `type` | TEXT | NOT NULL | Data type: 'string', 'number', 'boolean', 'date' |
| `fallback_value` | TEXT | NULLABLE | Default value when variable not provided (stored as string, type-specific formatting applied) |
| `is_required` | BOOLEAN | NOT NULL, DEFAULT false | Whether variable must be provided (true) or optional with fallback (false) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Variable definition creation timestamp |

**Indexes**:
- Primary key index on `id` (automatic)
- Composite unique index on `(template_id, key)` prevents duplicate variables per template
- Foreign key index on `template_id` for efficient joins

**Validation Rules**:
- `key` must be uppercase alphanumeric with underscores (e.g., "USER_NAME", "ORDER_ID")
- `type` must be one of: 'string', 'number', 'boolean', 'date'
- If `is_required` is true, `fallback_value` must be NULL (required variables cannot have fallbacks)
- If `is_required` is false, `fallback_value` should be set (optional variables should have fallbacks)
- `fallback_value` format validated against `type` (e.g., "42" for number type, "true"/"false" for boolean)

**State Transitions**: N/A (variables are stateless metadata)

**Relationships**:
- Many-to-one with `templates` (each variable belongs to exactly one template)
- Cascade delete: when parent template is deleted, all associated variables are automatically deleted

**Business Rules**:
- Variables are detected automatically from react-email-editor merge tags (FR-015)
- User defines type and fallback via UI after detection (FR-016)
- Variable key is immutable after creation (change requires delete + recreate)
- Removing merge tag from template content should orphan the variable record (cleanup on next save)

---

## Data Access Patterns

### High-Frequency Queries (Optimize with Indexes)

1. **SDK Template Rendering by Name**
   ```sql
   SELECT t.*, tv.*
   FROM templates t
   LEFT JOIN template_variables tv ON t.id = tv.template_id
   WHERE t.name = $1
   ```
   - **Frequency**: Every SDK `render()` call (production hot path)
   - **Optimization**: Unique index on `templates.name`, foreign key index on `template_variables.template_id`

2. **Template List with Pagination**
   ```sql
   SELECT * FROM templates
   ORDER BY updated_at DESC
   LIMIT $1 OFFSET $2
   ```
   - **Frequency**: Every dashboard /templates page load
   - **Optimization**: Index on `updated_at DESC` for efficient ORDER BY

3. **Template Count for Pagination**
   ```sql
   SELECT COUNT(*) FROM templates
   ```
   - **Frequency**: Every template list load (for pagination controls)
   - **Optimization**: Consider caching count for 60s or denormalized count table for large datasets

### Medium-Frequency Queries

4. **Load Single Template with Variables for Editing**
   ```sql
   SELECT t.*, json_agg(tv.*) as variables
   FROM templates t
   LEFT JOIN template_variables tv ON t.id = tv.template_id
   WHERE t.id = $1
   GROUP BY t.id
   ```
   - **Frequency**: Every template edit page load
   - **Optimization**: Foreign key index on `template_id`

5. **Create Template with Variables (Transaction)**
   ```sql
   BEGIN;
   INSERT INTO templates (name, content, html) VALUES ($1, $2, $3) RETURNING id;
   INSERT INTO template_variables (template_id, key, type, fallback_value, is_required)
   VALUES ($4, $5, $6, $7, $8), ...;
   COMMIT;
   ```
   - **Frequency**: Every template creation
   - **Optimization**: Use single INSERT with multiple rows for variables (batching)

### Low-Frequency Queries

6. **Update Template and Sync Variables**
   ```sql
   BEGIN;
   UPDATE templates SET content = $1, html = $2, updated_at = NOW() WHERE id = $3;
   DELETE FROM template_variables WHERE template_id = $3; -- Remove old variables
   INSERT INTO template_variables (template_id, key, type, fallback_value, is_required)
   VALUES ($4, $5, $6, $7, $8), ...; -- Insert new variables
   COMMIT;
   ```
   - **Frequency**: Every template save
   - **Optimization**: Transaction ensures atomicity, cascade delete handles cleanup

7. **Delete Template (Cascade Variables)**
   ```sql
   DELETE FROM templates WHERE id = $1
   -- template_variables automatically deleted via CASCADE
   ```
   - **Frequency**: Infrequent (user-initiated deletion)
   - **Optimization**: Cascade delete configured in schema

---

## Drizzle ORM Schema Definition

```typescript
// lib/db/schema.ts
import { pgTable, serial, text, jsonb, timestamp, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // SDK lookup key
  content: jsonb('content').notNull(), // react-email-editor JSON
  html: text('html').notNull(), // rendered HTML with merge tags
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for pagination ORDER BY updated_at DESC
  updatedAtIdx: index('templates_updated_at_idx').on(table.updatedAt.desc()),
}))

export const templateVariables = pgTable('template_variables', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id')
    .references(() => templates.id, { onDelete: 'cascade' })
    .notNull(),
  key: text('key').notNull(), // e.g., "NAME", "AGE"
  type: text('type').notNull(), // 'string' | 'number' | 'boolean' | 'date'
  fallbackValue: text('fallback_value'), // nullable
  isRequired: boolean('is_required').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique index: prevent duplicate variables per template
  templateIdKeyIdx: uniqueIndex('template_variables_template_id_key_idx')
    .on(table.templateId, table.key),
}))

// Drizzle relations for query API
export const templatesRelations = relations(templates, ({ many }) => ({
  variables: many(templateVariables),
}))

export const templateVariablesRelations = relations(templateVariables, ({ one }) => ({
  template: one(templates, {
    fields: [templateVariables.templateId],
    references: [templates.id],
  }),
}))

// TypeScript types inferred from schema
export type Template = typeof templates.$inferSelect
export type NewTemplate = typeof templates.$inferInsert
export type TemplateVariable = typeof templateVariables.$inferSelect
export type NewTemplateVariable = typeof templateVariables.$inferInsert
```

---

## Migration Strategy

### Development Phase (Current)
- Use `drizzle-kit push` for instant schema updates without migration files
- Fast iteration: edit schema → run `npm run db:push` → schema synced to NeonDB
- No migration history tracking (acceptable for prototyping)

### Production Transition (Future)
- Switch to `drizzle-kit generate` for versioned migrations
- Migration files committed to `lib/db/migrations/` directory
- Run `npm run db:migrate` on deployment to apply pending migrations
- Enables rollback and schema versioning for production safety

**Initial Migration** (auto-generated by Drizzle Kit):
```sql
-- lib/db/migrations/0001_initial_schema.sql
CREATE TABLE "templates" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "content" JSONB NOT NULL,
  "html" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX "templates_updated_at_idx" ON "templates" ("updated_at" DESC);

CREATE TABLE "template_variables" (
  "id" SERIAL PRIMARY KEY,
  "template_id" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fallback_value" TEXT,
  "is_required" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "template_variables_template_id_key_idx"
  ON "template_variables" ("template_id", "key");
```

---

## Data Integrity Constraints

1. **Referential Integrity**
   - Foreign key `template_variables.template_id → templates.id` with CASCADE DELETE
   - Ensures orphaned variables are impossible (deleting template removes variables)

2. **Uniqueness Constraints**
   - `templates.name` UNIQUE ensures no duplicate template names for SDK lookups
   - `(template_id, key)` UNIQUE ensures no duplicate variable keys per template

3. **Type Safety via Drizzle**
   - TypeScript types auto-generated from schema prevent type mismatches
   - Compile-time checking catches schema drift before runtime

4. **Application-Level Validation**
   - Template name sanitization prevents SQL injection (FR-019)
   - Variable type validation ensures fallback values match declared types
   - Required variables validated during SDK rendering (FR-014f)

---

## Performance Considerations

### Indexes for Query Optimization
- ✅ `templates.name` UNIQUE index → Fast SDK lookups by name (O(log n))
- ✅ `templates.updated_at DESC` index → Efficient pagination ORDER BY
- ✅ `(template_id, key)` UNIQUE index → Fast variable lookups and join optimization

### N+1 Query Prevention
- Use Drizzle `with` clause to join variables in single query:
  ```typescript
  const template = await db.query.templates.findFirst({
    where: eq(templates.name, templateName),
    with: { variables: true }, // Single query with LEFT JOIN
  })
  ```

### Connection Pooling
- Use `@neondatabase/serverless` driver with connection pooling
- Reuse connections across requests to reduce latency

### Caching Strategy (Future Optimization)
- Cache SDK template lookups by name (60s TTL) to reduce database load
- Invalidate cache on template update/delete
- Consider Redis for distributed caching in multi-instance deployments

---

## Summary

The data model uses a normalized two-table schema optimized for:
1. **Fast SDK rendering** via indexed template name lookups
2. **Efficient pagination** with updated_at DESC index
3. **Type safety** through Drizzle ORM TypeScript integration
4. **Data integrity** via foreign keys and unique constraints
5. **Flexible variables** with type metadata and fallback values

All design decisions align with Principle V (Database Schema as Code) and performance budgets (Principle VI).
