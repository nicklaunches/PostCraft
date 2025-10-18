# Implementation Plan: Local Studio Dashboard

**Branch**: `001-local-studio-dashboard` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-local-studio-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Develop a drop-in local studio with dashboard for email template management. The studio provides a visual interface at localhost:3579 for CRUD operations on email templates using react-email-editor, with export capabilities (primarily HTML) and programmatic SDK for template rendering. All UI elements use shadcn/ui components exclusively with TailwindCSS styling. Templates are stored in NeonDB (PostgreSQL) using Drizzle ORM. The SDK enables programmatic template rendering similar to Resend's architecture.

## Technical Context

**Language/Version**: TypeScript with strict mode enabled
**Primary Dependencies**: React, Next.js, shadcn/ui, TailwindCSS, react-email-editor (Unlayer), Drizzle ORM, NeonDB (PostgreSQL)
**Storage**: NeonDB (PostgreSQL) with two-table schema (templates, template_variables)
**Testing**: DEFERRED per user request - No test implementation in this iteration
**Target Platform**: Node.js development environment (localhost server on darwin/linux/win32)
**Project Type**: Web application (frontend + backend in Next.js app structure)
**Performance Goals**: Dashboard load <2s on 3G, template list with 100+ items <1s, API p95 <200ms
**Constraints**: Server binds to 127.0.0.1 only, offset pagination (20/page), manual saves only (no auto-save)
**Scale/Scope**: Single developer local environment, supports 100+ templates with pagination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Type Safety First
- ✅ **PASS**: TypeScript with strict mode specified in Technical Context
- ✅ **PASS**: Drizzle ORM mandated for all database operations (FR-031)
- ✅ **PASS**: No `any` types policy implicit in strict mode requirement
- ✅ **PASS**: API contracts planned for Phase 1 (contracts/ directory)

### Principle II: shadcn/ui Component Consistency (NON-NEGOTIABLE)
- ✅ **PASS**: FR-003 mandates shadcn/ui components exclusively for all UI elements
- ✅ **PASS**: FR-002a specifies sidebar-07 template as base dashboard layout
- ✅ **PASS**: UI-001 through UI-016 enumerate specific shadcn/ui components for every UI pattern
- ✅ **PASS**: UI-013 requires notification if component missing (pause for guidance)
- ✅ **PASS**: TailwindCSS mandated for all styling (FR-004, UI-012)

### Principle III: Test-Driven Development
- ⚠️ **DEFERRED**: User explicitly requested "Don't implement any tests" for faster iteration
- **Justification**: User prioritizes rapid prototyping over TDD in this cycle
- **Remediation Plan**: Tests should be added in subsequent iteration before production use
- **Impact**: Higher risk of regression, missing edge cases, and refactoring difficulty

### Principle IV: UX State Completeness
- ✅ **PASS**: FR-022 mandates loading states for all async operations
- ✅ **PASS**: FR-023 mandates error states with actionable messages
- ✅ **PASS**: FR-004 mandates empty state on /templates when no templates exist
- ✅ **PASS**: Loading states must appear within 100ms (FR-022, SC-008)
- ✅ **PASS**: FR-024 mandates keyboard navigation for all primary actions
- ✅ **PASS**: User stories specify loading, error, and empty states for each feature

### Principle V: Database Schema as Code
- ✅ **PASS**: FR-031 mandates Drizzle ORM for all database operations
- ✅ **PASS**: FR-032 mandates Drizzle Kit for automatic migration generation
- ✅ **PASS**: FR-033-039 specify two-table schema with foreign keys and constraints
- ✅ **PASS**: Schema defined in code (templates and template_variables tables detailed)

### Principle VI: Performance Budgets
- ✅ **PASS**: SC-001 specifies dashboard load <2s
- ✅ **PASS**: SC-003 specifies template list with 100+ items <1s
- ✅ **PASS**: Technical Context specifies API p95 <200ms
- ✅ **PASS**: FR-026, FR-034 mandate offset pagination with 20 items/page for collections
- ⚠️ **NEEDS VERIFICATION**: N+1 query prevention via indexes needs Phase 1 design

### Principle VII: Security by Default
- ✅ **PASS**: FR-001a mandates binding exclusively to 127.0.0.1 (localhost)
- ✅ **PASS**: FR-029a mandates POSTCRAFT_DATABASE_URL from environment
- ✅ **PASS**: FR-019 mandates template name sanitization to prevent SQL injection
- ✅ **PASS**: Drizzle ORM parameterized queries prevent SQL injection by design

### Gate Result: **CONDITIONAL PASS**
- **Blocker**: None
- **Warnings**:
  1. Principle III (TDD) deferred per user request - acceptable for prototyping phase
  2. Principle VI index verification deferred to Phase 1 design - acceptable as planned next step
- **Action**: Proceed to Phase 0 research with understanding tests are deferred

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/                          # Next.js App Router
├── (studio)/                 # Studio route group
│   ├── layout.tsx           # shadcn/ui sidebar-07 layout
│   ├── page.tsx             # Dashboard home
│   └── templates/           # Template routes
│       ├── page.tsx         # Template list with pagination
│       ├── new/
│       │   └── page.tsx     # Create template
│       └── [id]/
│           └── edit/
│               └── page.tsx # Edit template
├── api/                     # API routes
│   └── templates/
│       ├── route.ts         # GET (list with pagination), POST (create)
│       └── [id]/
│           └── route.ts     # GET (single), PUT (update), DELETE
└── layout.tsx               # Root layout

components/
├── ui/                      # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── skeleton.tsx
│   ├── alert.tsx
│   ├── toast.tsx
│   ├── pagination.tsx
│   └── sidebar.tsx          # sidebar-07 component
├── template-list.tsx        # Template list with empty/error states
├── template-editor.tsx      # react-email-editor wrapper
├── template-export.tsx      # HTML export with copy/download
└── variable-manager.tsx     # Merge tag variable metadata UI

lib/
├── db/
│   ├── schema.ts           # Drizzle schema (templates, template_variables)
│   ├── client.ts           # NeonDB connection
│   └── migrations/         # Auto-generated by Drizzle Kit
├── sdk/
│   └── postcraft.ts        # PostCraft SDK for template rendering
└── utils/
    ├── merge-tags.ts       # Merge tag parsing and substitution
    └── validation.ts       # Template name sanitization, type validation

public/                     # Static assets

.env.sample                # POSTCRAFT_* environment variable examples
drizzle.config.ts          # Drizzle Kit configuration
package.json               # npm scripts: studio, db:migrate, db:generate
tsconfig.json              # TypeScript strict mode configuration
```

**Structure Decision**: Next.js App Router web application structure selected. This aligns with the requirement for a localhost studio server (Next.js dev server) with both UI routes (`app/(studio)/*`) and API routes (`app/api/*`). The SDK is co-located in `lib/sdk/` for easy import by consuming applications. No separate backend/ frontend/ split needed as Next.js provides unified full-stack architecture. Tests directory omitted per user request to skip test implementation.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle III: TDD deferred | User requested faster iteration cycle without test implementation | TDD would slow initial prototyping; tests planned for subsequent iteration before production |

---

## Post-Design Constitution Re-Check

*Re-evaluation after Phase 1 design artifacts completed (research.md, data-model.md, contracts/)*

### Principle I: Type Safety First
- ✅ **VERIFIED**: API contracts defined in `contracts/api-templates.ts` and `contracts/sdk-postcraft.ts`
- ✅ **VERIFIED**: Drizzle schema with TypeScript types in data-model.md (`lib/db/schema.ts`)
- ✅ **VERIFIED**: Request/response interfaces for all endpoints
- ✅ **VERIFIED**: SDK error types defined (TemplateNotFoundError, TemplateVariableTypeError, etc.)

### Principle II: shadcn/ui Component Consistency (NON-NEGOTIABLE)
- ✅ **VERIFIED**: Research confirms sidebar-07 installation via `npx shadcn@latest add sidebar-07`
- ✅ **VERIFIED**: Project structure includes `components/ui/` for shadcn/ui components
- ✅ **VERIFIED**: All UI patterns mapped to specific shadcn/ui components (Button, Card, Dialog, etc.)

### Principle III: Test-Driven Development
- ⚠️ **STILL DEFERRED**: No change from initial check (user request)

### Principle IV: UX State Completeness
- ✅ **VERIFIED**: Quickstart.md documents loading, error, and empty states for all workflows
- ✅ **VERIFIED**: API contracts include error response interfaces for all endpoints
- ✅ **VERIFIED**: User stories in spec.md enumerate all four states (loading, success, error, empty)

### Principle V: Database Schema as Code
- ✅ **VERIFIED**: Complete Drizzle schema defined in data-model.md with:
  - Two tables: templates, template_variables
  - Foreign key with CASCADE DELETE
  - Unique indexes: templates.name, (template_id, key)
  - TypeScript type inference via `$inferSelect` and `$inferInsert`
- ✅ **VERIFIED**: Migration strategy documented (push for dev, generate for prod)

### Principle VI: Performance Budgets
- ✅ **VERIFIED**: Indexes optimized for high-frequency queries:
  - `templates.name` UNIQUE → O(log n) SDK lookups
  - `templates.updated_at DESC` → efficient pagination
  - `(template_id, key)` UNIQUE → fast variable joins
- ✅ **VERIFIED**: N+1 query prevention via Drizzle `with` clause (data-model.md query patterns)
- ✅ **VERIFIED**: Connection pooling strategy documented (Neon serverless driver)
- ✅ **VERIFIED**: Pagination LIMIT/OFFSET with 20 items/page

### Principle VII: Security by Default
- ✅ **VERIFIED**: Next.js custom server configuration with `hostname: '127.0.0.1'` (research.md)
- ✅ **VERIFIED**: Environment variable loading strategy documented (.env.sample, POSTCRAFT_ prefix)
- ✅ **VERIFIED**: Template name sanitization documented (validation.ts utility)
- ✅ **VERIFIED**: Drizzle ORM parameterized queries in all data access patterns

### Post-Design Gate Result: **PASS**
- ✅ All constitution principles verified in design artifacts
- ✅ Performance optimizations documented and indexed
- ✅ Security controls specified and enforceable
- ⚠️ TDD still deferred per user request (acceptable for prototyping)
- **Action**: Ready to proceed to Phase 2 (task generation via `/speckit.tasks`)

