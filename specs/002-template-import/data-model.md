# Data Model: Template Import from Unlayer JSON

**Date**: October 19, 2025
**Feature**: 002-template-import
**Phase**: 1 (Design & Contracts)

## Entity Overview

This feature uses the existing `postcraft_templates` table with no schema changes required. Unlayer JSON designs are stored in the existing `content` field (JSONB).

## Entity Definitions

### 1. Template (Existing - No Changes)

**Table**: `postcraft_templates`

**Purpose**: Stores email template metadata and content, including Unlayer design JSON.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | serial | PRIMARY KEY | Auto-incrementing unique identifier |
| `name` | text | NOT NULL, UNIQUE | User-provided template name (SDK lookup key) |
| `content` | jsonb | NOT NULL | Unlayer design JSON (includes body, counters, schemaVersion) |
| `html` | text | NULLABLE | Exported HTML with merge tags |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW() | Template creation timestamp |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Indexes**:
- `postcraft_templates_updated_at_idx` (existing): Optimizes pagination queries

**Schema** (No changes needed):
```typescript
// lib/db/schema.ts - Existing schema
export const templates = pgTable(
  "postcraft_templates",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    content: jsonb("content").notNull(), // Unlayer JSON stored here
    html: text("html"), // Exported HTML (generated when template is saved)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    updatedAtIdx: index("postcraft_templates_updated_at_idx").on(table.updatedAt),
  })
);
```

**Validation Rules**:
- `name` must be 1-200 characters
- `name` must be unique within the database
- `content` must contain valid Unlayer design structure (body, counters, schemaVersion)

**State Transitions**: N/A (no state machine)

---

## Import Flow Data

The import feature uses temporary client-side state to pass JSON data to the editor. No database operations occur until the user saves the template from the editor.

**Import Flow**:
1. User uploads JSON file → validation happens client-side
2. JSON is passed to editor via URL params or React state
3. Editor loads the Unlayer design
4. User names and saves → standard template creation flow

**No new entities or schema changes required**.

---

## TypeScript Type Definitions

```typescript
// lib/db/schema.ts - Exported types (existing)

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

// Unlayer design structure validation
export interface UnlayerDesign {
  body: {
    rows: any[];
    values: Record<string, any>;
  };
  counters: {
    u_column: number;
    u_row: number;
    u_content: number;
  };
  schemaVersion: number;
}
```

---

## Data Validation

### Client-Side Validation

Validation happens in the browser before redirecting to editor:

```typescript
// lib/utils/unlayer-validation.ts

export function isValidUnlayerDesign(json: any): json is UnlayerDesign {
  return (
    json &&
    typeof json === 'object' &&
    'body' in json &&
    'counters' in json &&
    'schemaVersion' in json &&
    typeof json.body === 'object' &&
    Array.isArray(json.body.rows) &&
    typeof json.counters === 'object' &&
    typeof json.schemaVersion === 'number'
  );
}

export const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5 MB
```

---

## Open Design Questions

None. No schema changes needed - uses existing template structure.

## Next Steps

- [x] Confirm no schema changes needed
- [x] Define validation utilities
- [ ] Update quickstart.md with JSON import workflow
- [ ] Create tasks.md with simplified implementation tasks
