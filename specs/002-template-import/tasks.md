# Tasks: Template Import from Unlayer JSON

**Input**: Design documents from `/specs/002-template-import/`
**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Per Constitution Principle III (TDD), integration tests are RECOMMENDED for the import flow. Unit tests for JSON validation are RECOMMENDED.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Next.js App Router structure: `app/`, `components/`, `lib/`, `tests/`
- All paths relative to repository root: `/Users/sitemax/Projects/postcraft.dev/PostCraft`

---

## Phase 1: Setup (No dependencies needed)

**Purpose**: This feature uses existing dependencies - no new packages required!

- [x] ~~T001~~ No dependencies to install - using existing Next.js, React, Unlayer, shadcn/ui

---

## Phase 2: Core Utilities

**Purpose**: Create JSON validation utilities

- [x] T005 Create Unlayer JSON validation utility in lib/utils/unlayer-validation.ts with isValidUnlayerDesign(json) function that checks for required properties (body, counters, schemaVersion)
- [x] T006 Add file size validation constant MAX_JSON_SIZE = 5 MB and MAX_JSON_CHARS = 5000000 in lib/utils/unlayer-validation.ts
- [x] T007 Add error messages for validation failures in lib/utils/unlayer-validation.ts
- [x] T008 Add helper function to determine JSON source priority (file over textarea) in lib/utils/unlayer-validation.ts

---

## Phase 3: User Story 1 - Import Unlayer JSON Template (Priority: P1) 🎯 MVP

**Goal**: Enable users to upload Unlayer JSON files and have them loaded directly into the editor at /templates/new

**Independent Test**: Upload a JSON file via the Import Template modal, verify redirect to /templates/new, verify the design loads in the editor

### UI Components for User Story 1

- [x] T010 [P] [US1] Create template import dialog component in components/template-import-dialog.tsx with textarea for pasting JSON and file upload input for JSON files
- [x] T011 [US1] Add "Import Template" button to templates page in app/(studio)/templates/page.tsx positioned left of "+ Create Template" button
- [x] T012 [US1] Implement textarea paste handler in components/template-import-dialog.tsx that reads and validates pasted JSON
- [x] T013 [US1] Implement file upload handler in components/template-import-dialog.tsx that reads JSON file and validates it
- [x] T014 [US1] Add source priority logic in components/template-import-dialog.tsx to prefer file over textarea when both are provided
- [x] T015 [US1] Add redirect logic in components/template-import-dialog.tsx to navigate to /templates/new with JSON data (via URL params or state)
- [x] T016 [US1] Modify template editor page in app/(studio)/templates/new/page.tsx to accept imported JSON and load it into Unlayer editor on mount
- [x] T017 [US1] Ensure template editor in components/template-editor.tsx can receive and load external JSON design data

**Checkpoint**: At this point, User Story 1 should be fully functional - users can import JSON files and see them loaded in the editor

---

## Phase 4: User Story 2 - Validation and Error Handling (Priority: P2)

**Goal**: Provide clear error messages for invalid uploads (wrong file type, invalid JSON, invalid Unlayer structure, oversized files)

**Independent Test**: Attempt to upload various invalid files and verify appropriate error messages appear for each scenario

### Validation Implementation for User Story 2

- [x] T020 [P] [US2] Add file type validation in components/template-import-dialog.tsx to check file extension is .json
- [x] T021 [P] [US2] Add file size validation in components/template-import-dialog.tsx to reject files exceeding 5 MB
- [x] T022 [P] [US2] Add textarea content size validation in components/template-import-dialog.tsx to reject pasted content exceeding ~5 million characters
- [x] T023 [P] [US2] Add JSON parse error handling in components/template-import-dialog.tsx to catch syntax errors from both file and textarea
- [x] T024 [US2] Add Unlayer structure validation in components/template-import-dialog.tsx using isValidUnlayerDesign function for both input sources
- [x] T025 [US2] Add empty input validation in components/template-import-dialog.tsx to check if both textarea and file are empty
- [x] T026 [US2] Add error state handling in components/template-import-dialog.tsx to display validation error messages

### UI Error Handling for User Story 2

- [x] T027 [US2] Add error message display component in components/template-import-dialog.tsx with clear, actionable text
- [x] T028 [US2] Add client-side file size check before reading file content
- [x] T029 [US2] Add client-side textarea content length check before processing
- [x] T030 [US2] Add user-friendly error messages for each validation failure type (including empty input, textarea vs file)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - valid imports succeed and invalid imports show clear error messages

---

## Phase 5: User Story 3 - Upload Progress and Confirmation (Priority: P3)

**Goal**: Show visual feedback during upload/processing and smooth transition to editor

**Independent Test**: Upload a valid JSON file and observe loading indicator during processing, then verify smooth redirect to editor

### Progress and Feedback Implementation for User Story 3

- [x] T035 [P] [US3] Add loading state to template import dialog in components/template-import-dialog.tsx with isProcessing boolean state
- [x] T036 [P] [US3] Add loading indicator UI in components/template-import-dialog.tsx using shadcn/ui Skeleton or spinner component
- [x] T037 [P] [US3] Add button disable logic in components/template-import-dialog.tsx to disable import button while isProcessing is true
- [x] T038 [P] [US3] Disable both textarea and file input while processing to prevent changes during validation
- [x] T039 [US3] Add smooth transition animation when redirecting to editor (optional enhancement)

**Checkpoint**: All user stories should now be independently functional - imports work, errors are clear, and progress feedback is complete

---

## Phase 6: Polish & Documentation

**Purpose**: Final improvements, documentation, and validation

- [ ] T045 [P] Add JSDoc documentation to lib/utils/unlayer-validation.ts with function documentation and @example blocks
- [ ] T046 Update .github/copilot-instructions.md to add template import feature context
- [ ] T047 Add example Unlayer JSON file to examples/ directory for testing (can be used for both paste and upload)
- [ ] T048 Test complete import flow using quickstart.md scenarios to validate all user stories (both paste and upload methods)
- [ ] T049 Update README.md with template import feature description mentioning both import methods
- [ ] T050 Run lint and type check: `npm run lint && npm run type-check`

---

## Optional: Testing Tasks

**NOTE**: These tests are OPTIONAL but RECOMMENDED for quality assurance.

### Integration Tests

- [ ] TOPT01 Create integration test for successful JSON import flow via file upload in tests/integration/template-import.test.ts
- [ ] TOPT02 [P] Create integration test for successful JSON import flow via textarea paste in tests/integration/template-import.test.ts
- [ ] TOPT03 [P] Create integration test for invalid JSON scenario in tests/integration/template-import.test.ts (both file and paste)
- [ ] TOPT04 [P] Create integration test for oversized file scenario in tests/integration/template-import.test.ts
- [ ] TOPT05 [P] Create integration test for file priority over textarea in tests/integration/template-import.test.ts

### Unit Tests

- [ ] TOPT06 [P] Create unit tests for JSON validation in tests/unit/unlayer-validation.test.ts covering valid JSON, invalid JSON, invalid structure, missing properties
- [ ] TOPT07 [P] Create unit tests for source priority logic in tests/unit/unlayer-validation.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - feature uses existing libraries
- **Core Utilities (Phase 2)**: No blocking dependencies - can start immediately
- **User Story 1 (Phase 3)**: Depends on Core Utilities (Phase 2) - MVP delivery
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) - Adds validation layer
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3) - Enhances UX
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Core Utilities (Phase 2) - MVP
- **User Story 2 (P2)**: Depends on User Story 1 - Integrates validation
- **User Story 3 (P3)**: Depends on User Story 1 - Adds progress feedback

### Parallel Opportunities

**Phase 2 (Core Utilities)**:
- T005, T006, T007 are related but can be developed sequentially (same file)

**Phase 3 (User Story 1)**:
- T010 and T016 can run in parallel (different concerns)
- T012 and T013 can run in parallel (different input handlers)
- T017 can run in parallel with other tasks

**Phase 4 (User Story 2)**:
- T020-T025 can run in parallel (validation concerns)
- T027-T030 can run in parallel (UI error handling)

**Phase 5 (User Story 3)**:
- T035, T036, T037, T038 can run in parallel (UI concerns)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Core Utilities (validation functions)
2. Complete Phase 3: User Story 1 (core import functionality)
3. **STOP and VALIDATE**: Test User Story 1 independently
4. **FEATURE IS USABLE AT THIS POINT** ✅

### Incremental Delivery

1. Add User Story 1 → Test independently → MVP! ✅
2. Add User Story 2 → Test independently → Better error handling ✅
3. Add User Story 3 → Test independently → Better UX ✅
4. Add Polish → Final validation → Production ready ✅

### Recommended Order for Solo Developer

1. T005-T008 (Core Utilities)
2. T010-T017 (UI Components and Editor Integration for US1)
3. **TEST US1** ← CHECKPOINT (test both paste and upload)
4. T020-T030 (Validation for US2)
5. **TEST US2** ← CHECKPOINT (test both input methods)
6. T035-T039 (Progress feedback for US3)
7. **TEST US3** ← CHECKPOINT
8. T045-T050 (Polish)
9. **FINAL VALIDATION** ← DONE

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3)
- Each user story should be independently completable and testable
- Stop at any checkpoint to validate story independently
- Much simpler than ZIP approach - fewer tasks, no backend complexity
- No database migrations needed - uses existing schema

---

## Task Count Summary

- **Total Tasks**: ~28 core tasks + 7 optional test tasks = **35 tasks**
- **Setup Phase**: 0 tasks (no dependencies!)
- **Core Utilities**: 4 tasks
- **User Story 1 (MVP)**: 8 tasks
- **User Story 2**: 10 tasks
- **User Story 3**: 5 tasks
- **Polish**: 6 tasks
- **Optional Tests**: 7 tasks

**Estimated Effort**:
- MVP (Utilities + US1): ~12 tasks = 0.75-1 day for solo developer
- Full Feature (All 3 stories + Polish): ~28 tasks = 1.5-2 days for solo developer
- With tests: ~35 tasks = 2-2.5 days for solo developer

**Comparison to ZIP approach**: ~50% reduction in complexity and effort!

**Note**: Adding textarea input increases tasks slightly but provides much better UX flexibility
