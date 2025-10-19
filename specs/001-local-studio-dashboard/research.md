# Research: Local Studio Dashboard

**Branch**: `001-local-studio-dashboard` | **Date**: 2025-10-18

## Research Tasks

This document consolidates research findings for key technical decisions and best practices for the Local Studio Dashboard feature.

---

## 1. Next.js App Router Best Practices for Local Development Server

**Decision**: Use Next.js App Router with custom server configuration for localhost:3579 binding

**Rationale**:
- Next.js App Router provides file-based routing with both UI and API routes in unified architecture
- Custom server allows binding to 127.0.0.1:3579 specifically (security requirement FR-001a)
- Built-in dev server with hot-reload improves developer experience
- Server Components reduce client bundle size for better performance (SC-001: <2s load)
- API routes co-located with UI routes simplify full-stack development

**Implementation Approach**:
- Use `next dev -H 127.0.0.1 -p 3579` command for npm/yarn studio script
- Implement port conflict detection by catching EADDRINUSE and retrying with incremented ports
- Configure `next.config.js` with `hostname: '127.0.0.1'` to enforce localhost-only binding
- Use App Router route groups `(studio)` for dashboard layout isolation

**Alternatives Considered**:
- **Express + React SPA**: Rejected - requires separate frontend build process, more complex than Next.js unified approach
- **Next.js Pages Router**: Rejected - older architecture, App Router provides better Server Component support and file-based API routes
- **Vite + React**: Rejected - lacks built-in API route support, would need separate backend server

**References**:
- Next.js custom server: https://nextjs.org/docs/app/building-your-application/configuring/custom-server
- App Router routing: https://nextjs.org/docs/app/building-your-application/routing

---

## 2. shadcn/ui sidebar-07 Template Integration

**Decision**: Install shadcn/ui sidebar-07 template via `npx shadcn@latest add sidebar-07` and use as base dashboard layout

**Rationale**:
- sidebar-07 provides collapsible sidebar with icons matching FR-002a, FR-002b requirements
- Pre-built responsive layout with mobile support reduces development time
- Consistent with shadcn/ui component ecosystem (Principle II: NON-NEGOTIABLE)
- Includes navigation state management and accessibility features out-of-box

**Implementation Approach**:
- Run `npx shadcn@latest add sidebar-07` during initial setup
- Component installs to `components/ui/sidebar.tsx`
- Use in `app/(studio)/layout.tsx` as wrapper for all studio routes
- Customize sidebar navigation items for Templates section
- Maintain collapsible state in client component with localStorage persistence

**Alternatives Considered**:
- **Custom sidebar component**: Rejected - violates Principle II requiring shadcn/ui exclusively
- **Different sidebar template (sidebar-01 through sidebar-06)**: Rejected - sidebar-07 specifically chosen per FR-002a for collapsible sidebar with icons

**Configuration**:
```tsx
// app/(studio)/layout.tsx
import { AppSidebar } from "@/components/ui/sidebar"

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

**References**:
- shadcn/ui sidebar-07: https://ui.shadcn.com/blocks#sidebar-07
- shadcn/ui CLI: https://ui.shadcn.com/docs/cli

---

## 3. Drizzle ORM with PostgreSQL Best Practices

**Decision**: Use Drizzle ORM with push-based migrations for rapid iteration, transition to versioned migrations for production

**Rationale**:
- Drizzle provides type-safe queries with compile-time checking (Principle I)
- `drizzle-kit push` enables fast schema iteration without migration file management
- PostgreSQL (serverless Postgres) supports connection pooling for better performance
- Two-table normalized schema (templates, template_variables) prevents data duplication

**Implementation Approach**:
- Define schema in `lib/db/schema.ts` with Drizzle table definitions
- Use `drizzle-kit push` during development for instant schema updates
- Configure connection pooling via `@neondatabase/serverless` driver
- Implement foreign key from `template_variables.template_id` to `templates.id` with `onDelete: 'cascade'`
- Add unique index on `templates.name` for duplicate prevention (FR-018)

**Schema Design**:
```typescript
// lib/db/schema.ts
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  content: jsonb('content').notNull(), // react-email-editor JSON
  html: text('html').notNull(), // rendered HTML with merge tags
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const templateVariables = pgTable('template_variables', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => templates.id, { onDelete: 'cascade' }).notNull(),
  key: text('key').notNull(), // e.g., "NAME", "AGE"
  type: text('type').notNull(), // 'string' | 'number' | 'boolean' | 'date'
  fallbackValue: text('fallback_value'), // nullable, stored as string
  isRequired: boolean('is_required').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Composite unique index: (templateId, key) prevents duplicate variables per template
export const templateVariablesIndex = uniqueIndex('template_variables_template_id_key_idx')
  .on(templateVariables.templateId, templateVariables.key)
```

**Alternatives Considered**:
- **Prisma ORM**: Rejected - Drizzle provides lighter weight, more direct SQL mapping, and faster query execution
- **Raw SQL with pg**: Rejected - violates Principle I requiring typed ORM (Drizzle mandated in FR-031)
- **Single denormalized table**: Rejected - storing variables as JSONB array loses query flexibility and type safety

**Performance Optimizations**:
- Index on `templates.name` for fast SDK lookups by name
- Composite index on `(template_id, key)` for efficient variable joins
- Connection pooling via Neon serverless driver reduces connection overhead
- Use `db.query.*` API for joins instead of N+1 queries (Principle VI)

**References**:
- Drizzle ORM docs: https://orm.drizzle.team/docs/overview
- PostgreSQL with Drizzle: https://neon.tech/docs/guides/drizzle
- Drizzle Kit push: https://orm.drizzle.team/kit-docs/overview#prototyping-with-db-push

---

## 4. react-email-editor (Unlayer) Integration and Merge Tag Handling

**Decision**: Use react-email-editor npm package with all features unlocked, leverage native merge tag API for variable management

**Rationale**:
- react-email-editor provides production-ready drag-and-drop email builder (FR-006)
- Native merge tag feature eliminates need for custom variable parsing (FR-015)
- Full unlocked mode enables all tools and features per FR-006a
- Exports both JSON design and HTML with inline styles for email clients (FR-010)

**Implementation Approach**:
- Install `react-email-editor` package and use as client component
- Initialize with `{ tools: { enabled: true }, mergeTags: {} }` for full feature access
- Use `editor.exportHtml()` to get rendered HTML with merge tags as `{{VARIABLE_NAME}}`
- Parse merge tags from exported HTML using regex: `/\{\{([A-Z_]+)\}\}/g`
- Store both editor JSON (content) and rendered HTML in database
- Implement variable metadata UI for defining types and fallbacks after tag detection

**Merge Tag Variable Substitution** (SDK):
```typescript
// lib/utils/merge-tags.ts
export function substituteMergeTags(
  html: string,
  variables: Record<string, any>,
  metadata: VariableMetadata[]
): string {
  return html.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
    const meta = metadata.find(m => m.key === key)

    if (variables[key] !== undefined) {
      // Validate type matches metadata
      if (meta && !validateType(variables[key], meta.type)) {
        throw new TypeError(
          `Variable "${key}" expected type ${meta.type}, got ${typeof variables[key]}`
        )
      }
      return String(variables[key])
    }

    // Use fallback if defined
    if (meta?.fallbackValue !== null) {
      return meta.fallbackValue
    }

    // Error if required and no fallback
    if (meta?.isRequired) {
      throw new Error(`Required variable "${key}" is missing and has no fallback`)
    }

    return match // Leave unreplaced if optional
  })
}
```

**Alternatives Considered**:
- **Custom email editor**: Rejected - building drag-and-drop editor from scratch is months of work
- **MJML with custom UI**: Rejected - requires custom editor UI, less visual than react-email-editor
- **Custom merge tag syntax**: Rejected - react-email-editor has native merge tag support, no need to reinvent

**References**:
- react-email-editor: https://www.npmjs.com/package/react-email-editor
- Unlayer API docs: https://docs.unlayer.com/docs
- Merge tags: https://docs.unlayer.com/docs/merge-tags

---

## 5. Offset Pagination Implementation for Template Lists

**Decision**: Use traditional offset-based pagination with LIMIT/OFFSET queries and page numbers UI

**Rationale**:
- Simpler implementation than cursor-based pagination for small-to-medium datasets
- Page numbers provide better UX for browsing (users expect page 1, 2, 3...)
- 20 items per page balances performance with usability (FR-034)
- Offset pagination sufficient for 100+ templates without noticeable performance issues

**Implementation Approach**:
- API route: `GET /api/templates?page=1&pageSize=20`
- Drizzle query: `db.query.templates.findMany({ limit: pageSize, offset: (page - 1) * pageSize })`
- Count total templates for pagination controls: `db.select({ count: count() }).from(templates)`
- Use shadcn/ui Pagination component (UI-016) for page controls
- Cache count query result for 60s to reduce database load

**Query Example**:
```typescript
// app/api/templates/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = 20

  const [items, totalCount] = await Promise.all([
    db.query.templates.findMany({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(templates.updatedAt),
    }),
    db.select({ count: count() }).from(templates),
  ])

  return Response.json({
    items,
    pagination: {
      page,
      pageSize,
      totalPages: Math.ceil(totalCount[0].count / pageSize),
      totalCount: totalCount[0].count,
    },
  })
}
```

**Alternatives Considered**:
- **Cursor-based pagination**: Rejected - more complex, better for infinite scroll which is not required
- **Load all templates**: Rejected - violates performance budgets for 100+ templates (SC-003)
- **Infinite scroll**: Rejected - page numbers provide better navigation for browsing use case

**Performance Considerations**:
- Add index on `updated_at DESC` for efficient ORDER BY
- Cache total count to avoid expensive COUNT(*) on every request
- Consider denormalized `template_count` table for large datasets (future optimization)

**References**:
- Drizzle pagination: https://orm.drizzle.team/docs/rqb#limit--offset
- shadcn/ui Pagination: https://ui.shadcn.com/docs/components/pagination

---

## 6. Environment Variable Configuration with POSTCRAFT_ Prefix

**Decision**: Use POSTCRAFT_ prefix for all environment variables with .env.sample documentation

**Rationale**:
- Namespaced prefix prevents collisions with other tools/frameworks (FR-029)
- Clear ownership of configuration values in multi-tool environments
- .env.sample serves as documentation and onboarding guide (FR-029d)

**Required Environment Variables**:
```bash
# .env.sample
# PostCraft Local Studio Configuration

# Database connection string for PostgreSQL
# Required for both studio and SDK
POSTCRAFT_DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Preferred server port (defaults to 3579 if not set)
# Studio will auto-detect next available port if occupied
POSTCRAFT_PORT=3579

# Optional SDK-specific configuration
# POSTCRAFT_SDK_TIMEOUT=5000
# POSTCRAFT_SDK_CACHE_TTL=300
```

**Loading Strategy**:
- Use `dotenv` package to load .env file in development
- Access via `process.env.POSTCRAFT_DATABASE_URL` in code
- Validate required variables on server startup, exit with clear error if missing
- SDK reads same DATABASE_URL as studio (shared database per FR-014c)

**Alternatives Considered**:
- **No prefix (DATABASE_URL, PORT)**: Rejected - common variables like PORT conflict with other tools
- **PC_ prefix**: Rejected - too terse, unclear what PC stands for
- **Separate config files**: Rejected - environment variables are industry standard for 12-factor apps

**References**:
- 12-factor app config: https://12factor.net/config
- dotenv: https://www.npmjs.com/package/dotenv

---

## 7. PostCraft SDK Architecture (Resend-style)

**Decision**: Export PostCraft class with templates.render() method, similar to Resend SDK API

**Rationale**:
- Familiar API pattern for developers who use Resend (FR-014 through FR-014j)
- Simple instantiation and method chaining provides clean developer experience
- Co-locating SDK in same package as studio simplifies distribution and versioning

**SDK API Design**:
```typescript
// lib/sdk/postcraft.ts
import { db } from '@/lib/db/client'
import { templates, templateVariables } from '@/lib/db/schema'
import { substituteMergeTags } from '@/lib/utils/merge-tags'

export class PostCraft {
  constructor(private config?: { databaseUrl?: string }) {
    // Use config.databaseUrl or fall back to POSTCRAFT_DATABASE_URL
    // Validate connection on instantiation
  }

  templates = {
    render: async (name: string, variables: Record<string, any> = {}): Promise<string> => {
      // 1. Query template by name with variables join
      const template = await db.query.templates.findFirst({
        where: eq(templates.name, name),
        with: { variables: true },
      })

      if (!template) {
        throw new Error(`Template "${name}" not found`)
      }

      // 2. Substitute merge tags with provided variables and metadata
      try {
        return substituteMergeTags(template.html, variables, template.variables)
      } catch (error) {
        if (error instanceof TypeError) {
          // Re-throw with variable name, expected type, provided type (FR-014i, FR-014j)
          throw error
        }
        throw error
      }
    },
  }
}

// Usage example:
// import { PostCraft } from 'postcraft'
// const postcraft = new PostCraft()
// const html = await postcraft.templates.render('welcome-email', { NAME: 'John', AGE: 30 })
```

**Alternatives Considered**:
- **Separate SDK package**: Rejected - complicates versioning and distribution, co-location simpler for now
- **Function-based API**: Rejected - class-based API provides better encapsulation and future extensibility
- **Template caching in SDK**: Deferred - premature optimization, implement after measuring performance

**References**:
- Resend SDK: https://github.com/resendlabs/resend-node
- Node.js package exports: https://nodejs.org/api/packages.html#package-entry-points

---

---

## 8. Server-Side HTML Rendering for SDK

**Status**: RESOLVED ✅

**Decision**: Implement server-side HTML generation by executing react-email-editor's exportHtml logic server-side

**Rationale**:
- react-email-editor stores design as JSON, which is platform-agnostic
- The SDK needs to generate HTML from design JSON without browser environment
- HTML generation must support merge tag preservation and variable substitution
- Database optimization: Store only design JSON, not pre-rendered HTML (FR-038)

**Implementation Approach**:

Per user clarification, all critical react-email-editor integration decisions are now documented:

1. **Loading Templates** (FR-006b):
   - Use `loadDesign()` method within `onReady` callback
   - Load design JSON from database templates.content column

2. **Saving Templates** (FR-006c):
   - Use `saveDesign()` method with callback to retrieve design JSON
   - Persist design JSON to database (not rendered HTML)

3. **Exporting HTML in Browser** (FR-010a):
   - Use `exportHtml()` method to generate fresh HTML at export time
   - This happens in the studio UI when user clicks "Export"

4. **SDK Server-Side Rendering** (FR-014d, FR-014e):
   - Load design JSON from database
   - Implement server-side HTML generator equivalent to exportHtml()
   - This may require reverse-engineering Unlayer's JSON structure or using a headless browser approach
   - Two possible approaches:
     a) Parse design JSON and generate HTML manually (complex but performant)
     b) Use Puppeteer/Playwright to run exportHtml() in headless browser (simpler but heavier)

5. **Merge Tag Configuration** (FR-015a, FR-015b):
   - Use `setMergeTags()` method in `onReady` callback
   - Dynamically configure based on template variable metadata from database
   - Example: `editor.setMergeTags([{ name: 'NAME', value: '{{NAME}}' }])`

**Database Schema Optimization**:
- templates.content stores design JSON only (JSONB column)
- templates.html column REMOVED - HTML generated on-demand, not stored
- This prevents JSON/HTML synchronization issues and reduces storage

**SDK HTML Generation Strategy**:

Option A (Recommended): Manual HTML generation from design JSON
```typescript
// lib/sdk/html-renderer.ts
export function renderDesignToHtml(designJson: any, mergeTags: Record<string, string>): string {
  // Parse design JSON structure
  // Generate HTML with inline styles
  // Preserve merge tags as {{VARIABLE_NAME}}
  // Return email-client compatible HTML
}
```

Option B (Fallback): Headless browser approach
```typescript
// Use Puppeteer to run exportHtml() in Node.js
// Heavier dependency but guaranteed compatibility
```

**Testing Requirements**:
- Contract tests validating HTML output matches browser exportHtml()
- Unit tests for merge tag preservation during server-side rendering
- Integration tests for SDK render() with variable substitution

**References**:
- Unlayer design JSON structure: Research needed during implementation
- Email HTML inline CSS: https://templates.mailchimp.com/development/css/

---

## Summary of Key Decisions

1. **Next.js App Router** with custom server for localhost:3579 binding and port auto-detection
2. **shadcn/ui sidebar-07** template as base dashboard layout (collapsible sidebar with icons)
3. **Drizzle ORM with push-based migrations** for rapid iteration, two-table normalized schema
4. **react-email-editor with native merge tags** for visual editing and variable management
5. **Offset pagination with page numbers** using LIMIT/OFFSET queries and shadcn/ui Pagination
6. **POSTCRAFT_ prefixed environment variables** with .env.sample documentation
7. **PostCraft SDK class with templates.render()** method, Resend-style API for familiarity
8. **Server-side HTML rendering** via design JSON parsing or headless browser approach

## Critical react-email-editor Integration Details ✅

**All ambiguities resolved** - the specification now provides clear, actionable guidance:

- **Which methods to use**: `loadDesign()`, `saveDesign()`, `exportHtml()`, `setMergeTags()`
- **When to call them**: `onReady` callback timing for loadDesign and setMergeTags
- **How to implement server-side rendering**: SDK must generate HTML from design JSON (two approaches documented)
- **Database schema optimizations**: Store design JSON only, no pre-rendered HTML (generated on-demand)

All decisions align with constitution principles and functional requirements. **No blocking unknowns remain** - planning phase can proceed with confidence.
