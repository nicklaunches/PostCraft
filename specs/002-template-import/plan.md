# Implementation Plan: Template Import from Unlayer JSON

**Branch**: `002-template-import` | **Date**: October 19, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-template-import/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to import Unlayer design JSON files through a simple upload interface. Upon successful upload and validation, the user is redirected to /templates/new with the imported design loaded in the editor. From there, the user can edit the design, name the template, and save it to their template library. This provides a seamless workflow for importing pre-designed templates from Unlayer exports or backups.

## Technical Context

**Language/Version**: TypeScript 5.3+ with Next.js 14.0+
**Primary Dependencies**: Next.js (App Router), React 18.2, Unlayer Email Editor, shadcn/ui components (Radix UI primitives)
**Storage**: Session/state management for temporary JSON storage during import flow
**Testing**: Jest/Vitest for unit tests, React Testing Library for component tests
**Target Platform**: Web application (Next.js server-side + client-side)
**Project Type**: Web application with Next.js App Router (frontend components + state management)
**Performance Goals**: Process JSON files up to 5 MB within 2 seconds; seamless editor loading
**Constraints**: Max JSON size 5 MB; files must be valid Unlayer design JSON; local-only binding (127.0.0.1)
**Scale/Scope**: Single-user local development tool; simple import flow focused on user experience

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Type Safety First
**Status**: ✅ PASS
**Verification**: TypeScript strict mode enabled in tsconfig.json. JSON validation will use type guards. Unlayer editor has TypeScript definitions. State management will be fully typed.

### Principle II: shadcn/ui Component Consistency
**Status**: ✅ PASS
**Verification**: Feature requires modal dialog (shadcn/ui Dialog), file input (shadcn/ui Input), button (shadcn/ui Button), loading states (shadcn/ui Skeleton). All components available in existing shadcn/ui setup. TailwindCSS for all styling.

### Principle III: Test-Driven Development
**Status**: ✅ PASS (Simplified - fewer tests needed)
**Verification**: Unit tests for JSON validation logic. Component tests for import dialog. Integration tests for import flow end-to-end. Much simpler than ZIP extraction approach.

### Principle IV: UX State Completeness
**Status**: ✅ PASS
**Verification**: All four states specified:
- Loading: Visual feedback during upload and validation
- Success: Smooth redirect to editor with loaded design
- Error: Validation failures with actionable messages (invalid JSON, wrong format, size limit)
- Empty: Modal starts empty by design

### Principle V: Database Schema as Code
**Status**: ✅ PASS (No schema changes needed)
**Verification**: Uses existing Template schema. No new tables or migrations required. JSON stored in existing 'content' field.

### Principle VI: Performance Budgets
**Status**: ✅ PASS
**Verification**: NFR-001 specifies 2-second processing for 5 MB files (well within budget). JSON parsing is fast. No API endpoint complexity.

### Principle VII: Security by Default
**Status**: ✅ PASS
**Verification**: Local studio binds to 127.0.0.1 (existing configuration). JSON validation prevents malicious payloads. File size limit prevents resource exhaustion. No external service dependencies (no S3 credentials exposure).

### Principle VIII: JSDoc Documentation & File Purpose
**Status**: ✅ CONDITIONAL (enforced during implementation)
**Verification**: All new TypeScript files must have file-level JSDoc. Validation logic requires explanatory JSDoc. Much simpler than ZIP approach.

### Overall Gate Status: ✅ PASS
All principles satisfied. Simpler implementation than ZIP approach reduces complexity.

### Overall Gate Status: ✅ PASS
All principles satisfied. TDD workflow and JSDoc requirements are enforceable during task execution phase.

### Post-Design Re-Evaluation (Phase 1 Complete)

**Date**: October 19, 2025

After completing data model, API contracts, and quickstart documentation, all constitution principles remain satisfied:

1. **Type Safety**: ✅ Contracts defined in `/contracts/api-import.ts` with full TypeScript interfaces, error codes, type guards, and validation constants. Data model includes complete type definitions for Template and TemplateAsset entities.

2. **shadcn/ui Components**: ✅ No new component requirements identified during design. All UI needs met by existing components (Dialog, Button, Input, Toast, Skeleton).

3. **Test-Driven Development**: ✅ Contract structure defined for test creation. Test files identified in project structure: `tests/contract/api-import.test.ts`, `tests/integration/template-import.test.ts`, and unit tests for services.

4. **UX State Completeness**: ✅ Error codes and messages documented in API contract with actionable details (e.g., MISSING_INDEX_HTML includes filesFound in error details). All four UI states remain specified.

5. **Database Schema as Code**: ✅ Complete schema defined in `data-model.md` with migration SQL, relationships, indexes, and Drizzle type exports. Schema changes are additive (new table + one column), ensuring backward compatibility.

6. **Performance Budgets**: ✅ NFR-002 maintained in design. S3 upload operations use AWS SDK with built-in retry logic. Database queries use indexed lookups and Drizzle relations to prevent N+1.

7. **Security by Default**: ✅ Environment variable validation added (FR-002a, FR-002b) with GET /api/templates/import/config endpoint. S3 credentials never exposed to client. Template name sanitization via parameterized queries.

8. **JSDoc Documentation**: ✅ API contract file includes comprehensive JSDoc with file-level description, function documentation, @example blocks, and inline comments for constants.

**Conclusion**: No constitution violations introduced during design phase. Proceed to Phase 2 (task generation).

## Project Structure

### Documentation (this feature)

```
specs/002-template-import/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (simplified for JSON import)
├── data-model.md        # Phase 1 output (no schema changes needed)
├── quickstart.md        # Phase 1 output (user guide for JSON import)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```
# Next.js App Router Web Application
app/
├── (studio)/
│   └── templates/
│       ├── page.tsx                    # MODIFY: Add "Import Template" button
│       └── new/
│           └── page.tsx                # MODIFY: Accept imported JSON via URL params or state

components/
├── template-import-dialog.tsx          # NEW: Import modal with JSON file upload
├── template-editor.tsx                 # MODIFY: Load imported JSON on mount
└── ui/                                 # EXISTING: shadcn/ui components
    ├── dialog.tsx
    ├── button.tsx
    ├── input.tsx
    └── toast.tsx

lib/
└── utils/
    └── unlayer-validation.ts           # NEW: Validate Unlayer JSON structure

tests/
├── integration/
│   └── template-import.test.ts        # NEW: E2E import flow test
└── unit/
    └── unlayer-validation.test.ts     # NEW: JSON validation unit tests
```

**Structure Decision**: Next.js App Router web application. Frontend-only implementation - no backend API needed. JSON validation happens client-side. State management via URL parameters or React context to pass JSON to editor. Much simpler than ZIP extraction approach.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**Status**: No violations documented. Simplified approach eliminates previous concerns.

````

