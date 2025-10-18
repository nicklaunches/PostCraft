# Implementation Plan: Local Studio Dashboard

**Branch**: `001-local-studio-dashboard` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-local-studio-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a local studio dashboard accessible at localhost:3579 for visual email template management. The system provides a visual interface using react-email-editor for template creation/editing, PostgreSQL storage via Drizzle ORM, and a programmatic SDK for template rendering with variable substitution (similar to Resend's architecture). Technical approach uses Next.js with shadcn/ui sidebar-07 layout, TypeScript strict mode, and server-side HTML generation from design JSON for both export and SDK rendering.

## Technical Context

**Language/Version**: TypeScript (latest) with strict mode enabled, Node.js 18+
**Primary Dependencies**: Next.js 14+, React 18+, shadcn/ui, TailwindCSS, react-email-editor (Unlayer), Drizzle ORM, PostgreSQL
**Storage**: PostgreSQL database with two-table schema (templates, template_variables)
**Testing**: Vitest for unit tests, Playwright for integration tests, contract testing for SDK API
**Target Platform**: Local development environment (localhost:3579), Node.js SDK for programmatic use
**Project Type**: Web application (Next.js monorepo with embedded SDK)
**Performance Goals**: Dashboard load <2s, template list (100+ items) <1s, API p95 <200ms
**Constraints**: Localhost-only binding (127.0.0.1), offset pagination for 20+ items, no auto-save
**Scale/Scope**: Single developer environment, 100+ templates support, 4 core UI states per feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Type Safety First ✅
- **Status**: PASS
- **Evidence**: TypeScript strict mode specified in technical context
- **Verification**: All database operations use Drizzle ORM (type-safe), API contracts defined in contracts/

### Principle II: shadcn/ui Component Consistency ✅
- **Status**: PASS
- **Evidence**: FR-003 mandates shadcn/ui components exclusively, FR-002b specifies sidebar-07 installation
- **Verification**: UI requirements (UI-001 through UI-016) enumerate specific shadcn/ui components for each pattern

### Principle III: Test-Driven Development ✅
- **Status**: PASS
- **Evidence**: Testing framework specified (Vitest, Playwright, contract tests)
- **Verification**: SC-007 through SC-009 define measurable test criteria, user stories structured as independently testable journeys

### Principle IV: UX State Completeness ✅
- **Status**: PASS
- **Evidence**: FR-022 through FR-027 mandate loading, error, empty states with specific timing (<100ms)
- **Verification**: User story acceptance criteria include all four states, keyboard navigation required (FR-024, SC-007)

### Principle V: Database Schema as Code ✅
- **Status**: PASS
- **Evidence**: FR-031 mandates Drizzle ORM, FR-032 requires Drizzle Kit migrations
- **Verification**: FR-033 through FR-039 specify two-table schema with foreign keys, constraints, and indexes

### Principle VI: Performance Budgets ✅
- **Status**: PASS
- **Evidence**: SC-001 (dashboard <2s), SC-003 (100+ templates <1s), performance goals in technical context
- **Verification**: FR-026, FR-033, FR-034 mandate offset pagination for 20+ items

### Principle VII: Security by Default ✅
- **Status**: PASS
- **Evidence**: FR-001a binds to 127.0.0.1 only, FR-029a uses environment variables for secrets
- **Verification**: FR-019 requires input sanitization, Drizzle ORM prevents SQL injection via parameterized queries

**Overall Assessment**: All seven constitution principles satisfied. No violations requiring justification.

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
src/
├── app/                      # Next.js app directory (routes)
│   ├── (dashboard)/         # Dashboard layout group
│   │   ├── layout.tsx       # Sidebar-07 layout wrapper
│   │   ├── page.tsx         # Dashboard home
│   │   └── templates/       # Template management routes
│   │       ├── page.tsx     # Template list (/templates)
│   │       ├── new/         # Create template
│   │       └── [id]/        # Edit template
│   └── api/                 # API routes (internal)
│       └── templates/       # Template CRUD endpoints
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── email-editor/        # react-email-editor wrapper
│   ├── template-list/       # Template list components
│   └── template-form/       # Template form components
├── lib/                     # Core libraries
│   ├── db/                  # Drizzle ORM configuration
│   │   ├── schema.ts        # Database schema definitions
│   │   ├── client.ts        # Database client setup
│   │   └── migrations/      # Drizzle migration files
│   ├── sdk/                 # PostCraft SDK implementation
│   │   ├── index.ts         # SDK entry point
│   │   ├── client.ts        # PostCraft class
│   │   ├── templates.ts     # Template rendering logic
│   │   └── html-renderer.ts # Server-side HTML generation
│   └── utils/               # Utility functions
├── types/                   # TypeScript type definitions
│   ├── template.ts          # Template entities
│   └── sdk.ts               # SDK interfaces
└── config/                  # Configuration files
    └── env.ts               # Environment variable validation

tests/
├── contract/                # SDK API contract tests
│   └── sdk.test.ts
├── integration/             # E2E tests (Playwright)
│   ├── dashboard.test.ts
│   ├── template-crud.test.ts
│   └── template-export.test.ts
└── unit/                    # Unit tests (Vitest)
    ├── html-renderer.test.ts
    └── variable-parser.test.ts
```

**Structure Decision**: Web application structure using Next.js App Router. The monorepo contains both the local studio dashboard (UI) and the PostCraft SDK (lib/sdk/) in a single codebase. This allows shared database schema and type definitions between studio and SDK, ensuring consistency. The app directory follows Next.js 14+ conventions with route groups for dashboard layout isolation.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No violations identified. All constitution principles are satisfied by the current design.

---

## Post-Design Constitution Re-evaluation

*Required after Phase 1 design artifacts are complete*

### Re-check After Design Completion

All Phase 1 artifacts have been generated:
- ✅ research.md: All technical decisions documented
- ✅ data-model.md: Database schema optimized (no HTML storage)
- ✅ quickstart.md: Developer onboarding guide complete
- ✅ contracts/: API contracts defined for templates and SDK

**Constitution Compliance Verification**:

### Principle I: Type Safety First ✅
- **Post-Design Status**: MAINTAINED
- **Evidence**: Drizzle schema defined with full TypeScript types in data-model.md
- **Changes**: Removed html column from templates table (optimization), maintaining strict type safety

### Principle II: shadcn/ui Component Consistency ✅
- **Post-Design Status**: MAINTAINED
- **Evidence**: Research confirms sidebar-07 installation, all UI components mapped to shadcn/ui
- **Changes**: None - strict adherence maintained

### Principle III: Test-Driven Development ✅
- **Post-Design Status**: MAINTAINED
- **Evidence**: Testing strategy defined (Vitest, Playwright, contract tests)
- **Changes**: None - TDD workflow ready for Phase 2

### Principle IV: UX State Completeness ✅
- **Post-Design Status**: MAINTAINED
- **Evidence**: All user stories include loading/error/success/empty states
- **Changes**: None - comprehensive state handling maintained

### Principle V: Database Schema as Code ✅
- **Post-Design Status**: MAINTAINED
- **Evidence**: Complete Drizzle schema in data-model.md, migration strategy documented
- **Changes**: Optimized schema by removing html column (FR-038) - generates on-demand instead

### Principle VI: Performance Budgets ✅
- **Post-Design Status**: MAINTAINED
- **Evidence**: Indexed queries, pagination strategy, connection pooling documented
- **Changes**: Schema optimization (no HTML storage) improves query performance

### Principle VII: Security by Default ✅
- **Post-Design Status**: MAINTAINED
- **Evidence**: Localhost binding (127.0.0.1), environment variables, Drizzle parameterized queries
- **Changes**: None - security requirements maintained

**Overall Post-Design Assessment**: All seven constitution principles remain satisfied after Phase 1 design. The database schema optimization (removing html column) actually **strengthens** compliance by reducing storage overhead and preventing JSON/HTML synchronization issues, improving both performance (Principle VI) and maintainability.

**No new violations introduced during design phase.** ✅

