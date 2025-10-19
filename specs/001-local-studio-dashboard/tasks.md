# Tasks: Local Studio Dashboard

**Input**: Design documents from `/specs/001-local-studio-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Last Updated**: 2025-10-18 - Updated for JSDoc documentation requirements (Constitution Principle VIII)

**Recent Updates**:
- 2025-10-18 - Added JSDoc documentation tasks per Constitution Principle VIII
- 2025-10-18 - Updated for database schema optimization (no HTML column storage)
- 2025-10-18 - Re-implemented T015 and Phase 3 (T020-T026) with proper shadcn/ui sidebar-07
- ⚠️ **T015 Re-executed**: Properly installed shadcn/ui sidebar-07 template via `npx shadcn@latest add sidebar-07`
- ⚠️ **Phase 3 Corrected**: Replaced custom sidebar implementation with proper shadcn/ui AppSidebar component
- ✅ **Principle II Compliance**: Now using shadcn/ui components exclusively (NON-NEGOTIABLE requirement)
- 🗑️ **Cleanup**: Removed custom sidebar.tsx and unused sample components (nav-projects, nav-user, team-switcher)
- 📝 **Principle VIII Compliance**: All TypeScript files require file-level JSDoc and public exports require JSDoc with @example blocks

**Key Design Changes**:
- ✅ **Database Optimization**: templates table does NOT store html column (FR-038)
- ✅ **On-Demand HTML Generation**: Use exportHtml() in studio UI and server-side HTML renderer in SDK
- ✅ **react-email-editor Integration**: Use loadDesign(), saveDesign(), exportHtml(), setMergeTags() methods
- ✅ **Server-Side Rendering**: SDK implements HTML generation from design JSON without browser

**Tests**: Tests are DEFERRED per user request in plan.md - No test tasks included in this implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js App Router**: `app/`, `components/`, `lib/` at repository root
- API routes: `app/api/`
- UI routes: `app/(studio)/`
- Shared utilities: `lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js project with TypeScript and configure tsconfig.json with strict mode enabled
- [x] T002 [P] Install core dependencies: next, react, react-dom, typescript, @types/react, @types/node
- [x] T003 [P] Install shadcn/ui dependencies: @radix-ui/react-* packages, class-variance-authority, clsx, tailwind-merge
- [x] T004 [P] Install Drizzle ORM dependencies: drizzle-orm, drizzle-kit, @neondatabase/serverless, dotenv
- [x] T005 [P] Install react-email-editor package for visual email editing
- [x] T006 Configure TailwindCSS in tailwind.config.ts with shadcn/ui theme variables
- [x] T007 Create .env.sample file documenting POSTCRAFT_DATABASE_URL and POSTCRAFT_PORT variables per research.md lines 281-296
- [x] T008 [P] Add npm scripts to package.json: "studio" (next dev -H 127.0.0.1 -p 3579), "db:push", "db:generate"
- [x] T009 [P] Configure ESLint and Prettier for code formatting and linting
- [x] T010 Create project directory structure: app/, components/ui/, lib/db/, lib/sdk/, lib/utils/

**Checkpoint**: Project initialized with all dependencies and basic structure ✅ COMPLETE

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Implement Drizzle schema in lib/db/schema.ts with templates (NO html column) and template_variables tables per data-model.md lines 210-220
- [x] T012 Create database client in lib/db/client.ts using @neondatabase/serverless driver with connection pooling per research.md section 3
- [x] T013 Configure drizzle.config.ts for Drizzle Kit with PostgreSQL connection string from POSTCRAFT_DATABASE_URL
- [x] T014 Run drizzle-kit push to initialize database schema in PostgreSQL
- [x] T015 [P] Install shadcn/ui sidebar-07 template via npx shadcn@latest add sidebar-07 per research.md lines 40-78
- [x] T016 [P] Install core shadcn/ui components: button, card, dialog, input, skeleton, alert, toast, pagination
- [x] T017 Create root layout in app/layout.tsx with TailwindCSS global styles and font configuration
- [x] T018 [P] Implement validation utilities in lib/utils/validation.ts for template name sanitization per FR-019
- [x] T019 [P] Implement template variable utilities in lib/utils/merge-tags.ts for variable substitution per research.md lines 162-195
- [ ] T019a [P] Add file-level JSDoc to lib/db/schema.ts describing database schema purpose and table relationships per Principle VIII
- [ ] T019b [P] Add file-level JSDoc to lib/db/client.ts describing database client configuration and connection pooling per Principle VIII
- [ ] T019c [P] Add file-level JSDoc to lib/utils/validation.ts describing validation utilities purpose per Principle VIII
- [ ] T019d [P] Add file-level JSDoc to lib/utils/merge-tags.ts describing merge tag substitution utilities per Principle VIII

**Checkpoint**: Foundation ready - database schema created, shadcn/ui installed, utilities available ✅ COMPLETE (JSDoc pending)

---

## Phase 3: User Story 1 - Dashboard Access and Navigation (Priority: P1) 🎯 MVP**Goal**: Developers can access the PostCraft local studio at localhost:3579 with functional navigation

**Independent Test**: Start server with `npm run studio`, navigate to localhost:3579, verify dashboard loads with sidebar-07 layout and collapsible sidebar navigation

### Implementation for User Story 1

- [x] T020 [P] [US1] Create studio layout in app/(studio)/layout.tsx using shadcn/ui sidebar-07 template with collapsible sidebar
- [x] T021 [P] [US1] Create dashboard home page in app/(studio)/page.tsx with welcome content and navigation overview
- [x] T022 [US1] Configure sidebar navigation items in app/(studio)/layout.tsx with Templates section link to /templates
- [x] T023 [US1] Add loading state component using shadcn/ui Skeleton in app/(studio)/loading.tsx
- [x] T024 [US1] Implement error boundary in app/(studio)/error.tsx using shadcn/ui Alert for server errors
- [x] T025 [US1] Add keyboard navigation support for sidebar using aria-labels and keyboard event handlers
- [x] T026 [US1] Test server startup and verify dashboard loads at localhost:3579 with proper binding to 127.0.0.1
- [ ] T026a [P] [US1] Add file-level JSDoc to app/(studio)/layout.tsx describing studio layout structure and sidebar configuration per Principle VIII
- [ ] T026b [P] [US1] Add file-level JSDoc to app/(studio)/page.tsx describing dashboard home page purpose per Principle VIII
- [ ] T026c [P] [US1] Add file-level JSDoc to app/(studio)/loading.tsx describing loading state component per Principle VIII
- [ ] T026d [P] [US1] Add file-level JSDoc to app/(studio)/error.tsx describing error boundary component per Principle VIII

**Checkpoint**: Dashboard accessible at localhost:3579 with functional sidebar navigation ✅ COMPLETE (JSDoc pending)

---

## Phase 4: User Story 2 - View and List Email Templates (Priority: P1)

**Goal**: Developers can view a paginated list of all email templates with empty states and loading states

**Independent Test**: Navigate to /templates, verify template list displays with pagination (if >20 templates), empty state shows when no templates exist, loading skeleton appears during fetch

### Implementation for User Story 2

- [x] T027 [P] [US2] Create GET /api/templates route in app/api/templates/route.ts implementing ListTemplatesResponse per contracts/api-templates.ts lines 45-92
- [x] T028 [P] [US2] Implement offset pagination query in app/api/templates/route.ts using LIMIT/OFFSET with pageSize=20 per data-model.md lines 219-253
- [x] T029 [P] [US2] Create templates list page in app/(studio)/templates/page.tsx with Server Component data fetching
- [x] T030 [US2] Implement TemplateList client component in components/template-list.tsx using shadcn/ui Card for template items
- [x] T031 [US2] Add empty state to components/template-list.tsx using shadcn/ui Alert with "Create New Template" call-to-action
- [x] T032 [US2] Add loading skeleton to app/(studio)/templates/loading.tsx using shadcn/ui Skeleton components
- [x] T033 [US2] Implement pagination controls in components/template-list.tsx using shadcn/ui Pagination component per UI-016
- [x] T034 [US2] Add error state handling in components/template-list.tsx with retry button using shadcn/ui Alert
- [x] T035 [US2] Add keyboard navigation for template cards using arrow key event handlers and focus management
- [x] T036 [US2] Add quick action buttons (edit, delete, export) to template cards with hover effects
- [ ] T036a [P] [US2] Add file-level JSDoc to app/api/templates/route.ts describing templates API endpoints and request/response contracts per Principle VIII
- [ ] T036b [P] [US2] Add JSDoc to GET handler in app/api/templates/route.ts with @example showing pagination query parameters per Principle VIII
- [ ] T036c [P] [US2] Add file-level JSDoc to app/(studio)/templates/page.tsx describing template list page purpose per Principle VIII
- [ ] T036d [P] [US2] Add file-level JSDoc to components/template-list.tsx describing template list component and props per Principle VIII
- [ ] T036e [P] [US2] Add JSDoc to public methods in components/template-list.tsx with parameter and return value documentation per Principle VIII

**Checkpoint**: Template list page functional with pagination, empty states, and loading states ✅ COMPLETE (JSDoc pending)

---

## Phase 5: User Story 8 - Programmatic Template Rendering via SDK (Priority: P2)

**Goal**: Developers can use PostCraft SDK to programmatically render templates with variable substitution

**Independent Test**: Import PostCraft SDK, call `postcraft.templates.render('template-name', { VAR: 'value' })`, verify HTML returned with variables replaced

**Note**: Implementing SDK early enables testing of template creation/editing in subsequent phases

### Implementation for User Story 8

- [x] T037 [P] [US8] Create PostCraft SDK class in lib/sdk/postcraft.ts with constructor accepting PostCraftConfig per contracts/sdk-postcraft.ts lines 76-97
- [x] T038 [P] [US8] Implement templates.render() method in lib/sdk/postcraft.ts with database query and template variable substitution per contracts/sdk-postcraft.ts lines 102-131
- [x] T038a [P] [US8] Create lib/sdk/html-renderer.ts implementing server-side HTML generation from react-email-editor design JSON per research.md section 8
- [x] T038b [US8] Research react-email-editor design JSON structure and implement HTML generation algorithm in lib/sdk/html-renderer.ts
- [x] T038c [US8] Implement template variable replacement algorithm in lib/sdk/html-renderer.ts supporting {{VARIABLE}} syntax with fallback value handling per FR-016e
- [x] T039 [US8] Add database connection logic to PostCraft constructor using POSTCRAFT_DATABASE_URL environment variable
- [x] T040 [US8] Implement error classes in lib/sdk/postcraft.ts: TemplateNotFoundError, TemplateVariableTypeError, RequiredVariableMissingError, DatabaseConnectionError per contracts/sdk-postcraft.ts lines 36-70
- [x] T041 [US8] Add variable type validation in templates.render() method checking provided values against template variable metadata types
- [x] T042 [US8] Implement fallback value logic in templates.render() using metadata when variables are missing
- [x] T043 [US8] Add required variable validation throwing RequiredVariableMissingError when required variables missing with no fallback
- [x] T044 [US8] Update package.json exports to expose PostCraft SDK: "exports": { ".": "./lib/sdk/postcraft.ts" }
- [x] T045 [US8] Test SDK with sample template: create template in database, call render(), verify HTML output with substituted variables
- [ ] T045a [P] [US8] Add comprehensive file-level JSDoc to lib/sdk/postcraft.ts describing SDK purpose and usage patterns with @example per Principle VIII
- [ ] T045b [P] [US8] Add JSDoc to PostCraft class constructor with @param for config and @throws for connection errors with @example per Principle VIII
- [ ] T045c [P] [US8] Add JSDoc to templates.render() method with @param, @returns, @throws, and @example showing variable substitution per Principle VIII
- [ ] T045d [P] [US8] Add JSDoc to PostCraftConfig interface documenting all configuration options per Principle VIII
- [ ] T045e [P] [US8] Add file-level JSDoc to lib/sdk/html-renderer.ts describing HTML rendering algorithm and design JSON processing per Principle VIII
- [ ] T045f [P] [US8] Add JSDoc to renderDesignToHtml() and substituteMergeTags() functions with @param, @returns, and @example per Principle VIII
- [ ] T045g [P] [US8] Add file-level JSDoc to lib/sdk/errors.ts describing error classes and their usage per Principle VIII
- [ ] T045h [P] [US8] Add JSDoc to each error class with @example showing when each error is thrown per Principle VIII

**Checkpoint**: PostCraft SDK functional with comprehensive JSDoc documentation ✅ COMPLETE (JSDoc pending)

---

## Phase 6: User Story 3 - Create New Email Template (Priority: P2)

**Goal**: Developers can create new email templates using react-email-editor with visual design

**Independent Test**: Click "Create New Template" from /templates, design email in editor, save with name, verify template appears in list

### Implementation for User Story 3

- [x] T046 [P] [US3] Create POST /api/templates route in app/api/templates/route.ts implementing CreateTemplateRequest/Response per contracts/api-templates.ts lines 96-168
- [x] T047 [P] [US3] Implement template creation transaction in app/api/templates/route.ts: INSERT template, INSERT variables, handle unique constraint violations
- [x] T048 [P] [US3] Create new template page in app/(studio)/templates/new/page.tsx with client-side editor component
- [x] T049 [US3] Implement TemplateEditor component in components/template-editor.tsx wrapping react-email-editor with all features enabled per FR-006a
- [x] T050 [US3] Configure react-email-editor in components/template-editor.tsx with template variables (merge tags) enabled and full tools unlocked per research.md lines 143-205
- [x] T051 [US3] Add template name input to app/(studio)/templates/new/page.tsx using shadcn/ui Input with validation
- [x] T052 [US3] Implement save handler in app/(studio)/templates/new/page.tsx calling saveDesign() to get design JSON and POST /api/templates
- [x] T053 [US3] Add loading state during save using shadcn/ui Toast for "Saving..." notification
- [x] T054 [US3] Add success/error feedback after save using shadcn/ui Toast with redirect to /templates on success
- [x] T055 [US3] Implement unsaved changes warning using browser beforeunload event per FR-025
- [x] T056 [US3] Add validation for template name (1-100 chars, alphanumeric + hyphens/underscores) using lib/utils/validation.ts
- [x] T057 [US3] Handle duplicate name error from API showing shadcn/ui Alert with field-specific error per contracts/api-templates.ts lines 162-167
- [ ] T057a [P] [US3] Add JSDoc to POST handler in app/api/templates/route.ts documenting request/response with @example per Principle VIII
- [ ] T057b [P] [US3] Add file-level JSDoc to app/(studio)/templates/new/page.tsx describing template creation page per Principle VIII
- [ ] T057c [P] [US3] Add file-level JSDoc to components/template-editor.tsx describing react-email-editor wrapper and configuration per Principle VIII
- [ ] T057d [P] [US3] Add JSDoc to TemplateEditor component props and public methods with @example per Principle VIII

**Checkpoint**: Template creation functional with react-email-editor, validation, and error handling ✅ COMPLETE (JSDoc pending)

---

## Phase 7: User Story 4 - Edit Existing Email Template (Priority: P2)

**Goal**: Developers can edit existing templates with changes persisted to database

**Independent Test**: Click "Edit" on existing template, modify in editor, save, verify changes reflected in template list

### Implementation for User Story 4

- [x] T058 [P] [US4] Create GET /api/templates/[id] route in app/api/templates/[id]/route.ts implementing GetTemplateResponse per contracts/api-templates.ts lines 171-205
- [x] T059 [P] [US4] Create PUT /api/templates/[id] route in app/api/templates/[id]/route.ts implementing UpdateTemplateRequest/Response per contracts/api-templates.ts lines 208-267
- [x] T060 [P] [US4] Implement update transaction in app/api/templates/[id]/route.ts: UPDATE template, DELETE old variables, INSERT new variables per data-model.md lines 177-188
- [x] T061 [P] [US4] Create edit template page in app/(studio)/templates/[id]/edit/page.tsx loading template data server-side
- [ ] T061a [US4] Implement template lock mechanism in database using a template_locks table or lock_acquired_at timestamp column per FR-033 [DEFERRED - Advanced feature]
- [ ] T061b [US4] Add lock acquisition logic in GET /api/templates/[id] route to check and set edit lock with session identifier [DEFERRED - Requires T061a]
- [ ] T061c [US4] Add lock release logic on page unload using beforeunload event and API call to release lock [DEFERRED - Requires T061a]
- [x] T062 [US4] Load template content into TemplateEditor component using editor.loadDesign() method with template.content JSON
- [ ] T062a [US4] Detect if template is locked by another session and display read-only mode with shadcn/ui Alert notification per FR-034 [DEFERRED - Requires T061a]
- [x] T063 [US4] Implement save handler in app/(studio)/templates/[id]/edit/page.tsx calling PUT /api/templates/[id]
- [x] T064 [US4] Add loading state for template fetch using shadcn/ui Skeleton while template data loads
- [x] T065 [US4] Add error handling for template not found (404) using shadcn/ui Alert with link back to /templates
- [x] T066 [US4] Implement unsaved changes tracking and warning using beforeunload event per FR-025
- [x] T067 [US4] Preserve editor state in memory on failed save per FR-023a with retry button using shadcn/ui Alert
- [x] T068 [US4] Add keyboard shortcuts for save (Cmd+S / Ctrl+S) using keydown event handler
- [ ] T068a [P] [US4] Add file-level JSDoc to app/api/templates/[id]/route.ts describing template CRUD operations per Principle VIII
- [ ] T068b [P] [US4] Add JSDoc to GET, PUT handlers in app/api/templates/[id]/route.ts with @param, @returns, @throws per Principle VIII
- [ ] T068c [P] [US4] Add file-level JSDoc to app/(studio)/templates/[id]/edit/page.tsx describing template editing page per Principle VIII

**Checkpoint**: Template editing functional with proper loading, error states, and unsaved changes protection ✅ COMPLETE (locking features deferred, JSDoc pending)

---

## Phase 8: User Story 5 - Delete Email Template (Priority: P2)

**Goal**: Developers can delete templates with confirmation dialog

**Independent Test**: Click "Delete" on template, confirm in dialog, verify template removed from list

### Implementation for User Story 5

- [ ] T069 [P] [US5] Create DELETE /api/templates/[id] route in app/api/templates/[id]/route.ts implementing DeleteTemplateResponse per contracts/api-templates.ts lines 270-297
- [ ] T070 [P] [US5] Implement cascade delete in DELETE route relying on database foreign key CASCADE per data-model.md section on referential integrity
- [ ] T071 [US5] Add delete button to template cards in components/template-list.tsx using shadcn/ui Button with destructive variant
- [ ] T072 [US5] Implement delete confirmation dialog in components/template-list.tsx using shadcn/ui Dialog with warning message
- [ ] T073 [US5] Add delete handler calling DELETE /api/templates/[id] and refreshing template list on success
- [ ] T074 [US5] Add success notification after deletion using shadcn/ui Toast with template name
- [ ] T075 [US5] Add error handling for deletion failures using shadcn/ui Alert with retry option
- [ ] T076 [US5] Add keyboard navigation for confirmation dialog (Enter to confirm, Escape to cancel) using aria-labels
- [ ] T076a [P] [US5] Add JSDoc to DELETE handler in app/api/templates/[id]/route.ts documenting cascade deletion behavior per Principle VIII

**Checkpoint**: Template deletion functional with confirmation and proper error handling

---

## Phase 9: User Story 7 - Template Variables Management (Priority: P3)

**Goal**: Developers can define variable metadata (type, fallback) for merge tags detected in templates

**Independent Test**: Create/edit template with merge tags, verify variables detected, define types and fallbacks, save and verify metadata persisted

### Implementation for User Story 7

- [ ] T077 [P] [US7] Implement template variable detection in components/template-editor.tsx by calling exportHtml() and parsing with regex /\{\{([A-Z_]+)\}\}/g per research.md lines 162-195
- [ ] T078 [P] [US7] Create VariableManager component in components/variable-manager.tsx for defining variable metadata
- [ ] T079 [US7] Add variable metadata form to components/variable-manager.tsx with fields: key (read-only), type (Select), fallbackValue (Input), isRequired (Checkbox)
- [ ] T080 [US7] Implement type selection dropdown in components/variable-manager.tsx using shadcn/ui Select with options: string, number, boolean, date
- [ ] T081 [US7] Add variable metadata validation: required variables cannot have fallbacks, fallback values must match type format
- [ ] T082 [US7] Update template save handlers (create and edit pages) to include variables array in POST/PUT request body
- [ ] T083 [US7] Display detected variables in VariableManager during template creation/editing with real-time detection on editor changes
- [ ] T084 [US7] Add variable removal detection comparing old and new merge tags, removing orphaned variables from metadata
- [ ] T085 [US7] Test variable metadata persistence by creating template with variables, saving, reopening, and verifying metadata retained
- [ ] T085a [P] [US7] Add file-level JSDoc to components/variable-manager.tsx describing variable metadata management per Principle VIII
- [ ] T085b [P] [US7] Add JSDoc to VariableManager component props and methods documenting variable detection and validation per Principle VIII

**Checkpoint**: Variable management functional with type definitions, fallbacks, and validation

---

## Phase 10: User Story 6 - Export Email Template as HTML (Priority: P3)

**Goal**: Developers can export templates as HTML with copy-to-clipboard and download options

**Independent Test**: Click "Export" on template, verify HTML generated with inline styles, copy to clipboard works, download works

### Implementation for User Story 6

- [ ] T086 [P] [US6] Create TemplateExport component in components/template-export.tsx with export interface
- [ ] T087 [P] [US6] Add "Export" button to template cards in components/template-list.tsx opening export dialog
- [ ] T088 [US6] Implement HTML export in components/template-export.tsx loading template.content into editor and calling exportHtml() to generate HTML on-demand
- [ ] T089 [US6] Add copy-to-clipboard functionality using navigator.clipboard.writeText() with success feedback via shadcn/ui Toast
- [ ] T090 [US6] Add download functionality creating Blob with HTML content and triggering download with anchor element
- [ ] T091 [US6] Add loading state during export using shadcn/ui Skeleton while fetching template data
- [ ] T092 [US6] Verify template variables preserved in exported HTML in format {{VARIABLE_NAME}} per FR-013
- [ ] T093 [US6] Add empty template warning when exporting template with no content using shadcn/ui Alert with confirmation
- [ ] T094 [US6] Add error handling for export failures using shadcn/ui Alert with retry option
- [ ] T094a [P] [US6] Add file-level JSDoc to components/template-export.tsx describing HTML export functionality per Principle VIII
- [ ] T094b [P] [US6] Add JSDoc to TemplateExport component methods documenting export, copy, and download operations per Principle VIII

**Checkpoint**: HTML export functional with copy, download, and proper merge tag preservation

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T095 [P] Add consistent error handling across all API routes with proper HTTP status codes and error response formats
- [ ] T096 [P] Implement request validation for all API routes validating request body schemas match contracts
- [ ] T097 [P] Add consistent loading states across all pages using shadcn/ui Skeleton components
- [ ] T098 [P] Ensure all forms have proper validation with real-time feedback using shadcn/ui form components
- [ ] T099 [P] Add WCAG 2.1 AA accessibility: aria-labels, keyboard navigation, focus management across all components
- [ ] T100 [P] Verify all shadcn/ui components use theme variables for consistent styling per UI-015
- [ ] T101 [P] Add proper TypeScript types for all components, utilities, and API routes with strict mode compliance
- [ ] T102 [P] Implement proper error logging for debugging (console.error for client, structured logging for server)
- [ ] T103 Verify performance budgets: dashboard load <2s, template list <1s, API p95 <200ms per plan.md SC-001, SC-003
- [ ] T104 Test edge cases: port conflict (3579 occupied), database connection failure, corrupted template JSON
- [ ] T105 Verify localhost-only binding to 127.0.0.1 rejecting external connections per FR-001a
- [ ] T106 Run through quickstart.md validation: install, setup, create template, edit, delete, SDK usage
- [ ] T107 [P] Update CLAUDE.md with final technology stack and project structure
- [ ] T108 Code cleanup: remove unused imports, add comments for complex logic, ensure consistent formatting
- [ ] T109 [P] Verify all TypeScript files have file-level JSDoc comments per Principle VIII
- [ ] T110 [P] Verify all public exports (functions, classes, interfaces) have JSDoc with @param, @returns, @throws per Principle VIII
- [ ] T111 [P] Verify all SDK methods and public APIs have @example blocks in JSDoc per Principle VIII
- [ ] T112 [P] Add JSDoc to complex internal functions with branching complexity >3 per Principle VIII
- [ ] T113 Conduct JSDoc documentation audit across all files ensuring compliance with Principle VIII

**Checkpoint**: All polish tasks complete, JSDoc documentation comprehensive, application ready for production use

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-10)**: All depend on Foundational phase completion
  - **US1 (Phase 3)**: Can start after Foundational - Dashboard foundation
  - **US2 (Phase 4)**: Depends on US1 (requires dashboard navigation)
  - **US8 (Phase 5)**: Can start after Foundational - SDK implementation (prioritized to enable testing)
  - **US3 (Phase 6)**: Depends on US1, US2 (requires navigation and list to verify creation)
  - **US4 (Phase 7)**: Depends on US1, US2, US3 (requires templates to exist for editing)
  - **US5 (Phase 8)**: Depends on US1, US2 (requires navigation and list)
  - **US7 (Phase 9)**: Depends on US3, US4 (variables managed during create/edit)
  - **US6 (Phase 10)**: Depends on US2 (export triggered from template list)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Setup (Phase 1)
    ↓
Foundational (Phase 2)
    ↓
    ├─→ US1: Dashboard (Phase 3) ─────────────────────┐
    │       ↓                                          │
    │   US2: List Templates (Phase 4) ─────────────────┤
    │       ↓                                          │
    │       ├─→ US3: Create (Phase 6) ──┐              │
    │       │       ↓                    │              │
    │       ├─→ US4: Edit (Phase 7) ────┤              │
    │       │       ↓                    │              │
    │       ├─→ US5: Delete (Phase 8)   │              │
    │       │                            ↓              │
    │       └─→ US6: Export (Phase 10)  US7: Variables │
    │                                    (Phase 9)      │
    └─→ US8: SDK (Phase 5) ─────────────────────────────┘
            ↓
    Polish (Phase 11)
```

### Within Each User Story

- API routes before UI components that consume them
- Database queries before business logic
- Core implementation before integration with other stories
- Error handling after happy path implementation

### Parallel Opportunities

- **Phase 1 (Setup)**: Tasks T002-T005, T007, T009 can run in parallel (different files)
- **Phase 2 (Foundational)**: Tasks T015-T016, T018-T019 can run in parallel
- **Phase 4 (US2)**: Tasks T027-T028 can run in parallel (API route separate from UI)
- **Phase 5 (US8)**: Tasks T037-T038 can run in parallel (class structure and render method)
- **Phase 6 (US3)**: Tasks T046-T048 can run in parallel (API route separate from UI pages)
- **Phase 7 (US4)**: Tasks T058-T061 can run in parallel (different API routes and page)
- **Phase 8 (US5)**: Tasks T069-T070 can run in parallel (API route separate from UI)
- **Phase 9 (US7)**: Tasks T077-T078 can run in parallel (detection logic separate from UI)
- **Phase 10 (US6)**: Tasks T086-T087 can run in parallel (export component and button)
- **Phase 11 (Polish)**: Tasks T095-T102, T107-T108 can run in parallel (different areas)

---

## Parallel Example: User Story 2

```bash
# Launch API route and UI page creation in parallel:
Task T027: "Create GET /api/templates route in app/api/templates/route.ts"
Task T028: "Implement offset pagination query in app/api/templates/route.ts"
Task T029: "Create templates list page in app/(studio)/templates/page.tsx"

# After API route complete, launch UI components in parallel:
Task T030: "Implement TemplateList component in components/template-list.tsx"
Task T032: "Add loading skeleton to app/(studio)/templates/loading.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Dashboard)
4. Complete Phase 4: User Story 2 (List Templates)
5. **STOP and VALIDATE**: Test dashboard navigation and template list
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Dashboard) → Test independently
3. Add US2 (List Templates) → Test independently → Deploy/Demo (Browse templates MVP!)
4. Add US8 (SDK) → Test SDK rendering → Deploy/Demo (SDK integration ready!)
5. Add US3 (Create) → Test independently → Deploy/Demo (Template authoring ready!)
6. Add US4 (Edit) → Test independently → Deploy/Demo (Full CRUD ready!)
7. Add US5 (Delete) → Test independently → Deploy/Demo
8. Add US7 (Variables) → Test independently → Deploy/Demo (Dynamic templates ready!)
9. Add US6 (Export) → Test independently → Deploy/Demo (Manual integration ready!)
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 + US2 (Dashboard and List)
   - Developer B: US8 (SDK - enables testing for others)
   - After US1+US2 complete:
     - Developer C: US3 (Create)
     - Developer D: US6 (Export)
3. After US3 complete:
   - Developer A: US4 (Edit)
   - Developer C: US5 (Delete)
   - Developer D: US7 (Variables)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests DEFERRED per user request - manual validation required at each checkpoint
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- SDK (US8) prioritized in Phase 5 to enable testing of template creation/editing
- All API routes follow contracts defined in contracts/api-templates.ts
- All database operations use Drizzle ORM per plan.md Principle V
- All UI components use shadcn/ui exclusively per plan.md Principle II (NON-NEGOTIABLE)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
