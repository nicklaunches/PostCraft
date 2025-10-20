# Research: Template Import from Unlayer JSON

**Date**: October 19, 2025
**Feature**: 002-template-import
**Phase**: 0 (Outline & Research)

## Research Tasks Completed

### 1. File Upload Approach for Next.js

**Decision**: Use native browser File API with client-side validation

**Rationale**:
- JSON files are small (typically <1 MB, max 5 MB)
- Client-side validation is sufficient - no backend processing needed
- FileReader API can read JSON content directly in browser
- No need for server-side upload since we're just passing JSON to editor

**Implementation Notes**:
- Use `<input type="file" accept=".json" />` for file selection
- Read file content with `FileReader.readAsText()`
- Validate JSON structure before redirect
- Pass validated JSON to editor via URL params or React context/state

### 2. Unlayer JSON Structure Validation

**Decision**: Validate required properties: `body`, `counters`, `schemaVersion`

**Rationale**:
- Unlayer exports have a specific structure that the editor expects
- Validating structure prevents errors when loading into editor
- Simple type checking is sufficient - no need for complex schema validation

**Required Properties**:
```typescript
interface UnlayerDesign {
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

**Implementation Pattern**:
```typescript
function isValidUnlayerDesign(json: any): json is UnlayerDesign {
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
```

### 3. Passing Data Between Components

**Decision**: Use Next.js navigation with state or URL parameters

**Rationale**:
- Simple and works with Next.js App Router
- No need for global state management for this flow
- State is temporary - only needed during import/redirect

**Options Considered**:
1. **Next.js router state** (Recommended):
   ```typescript
   router.push('/templates/new', { state: { importedDesign: json } });
   ```

2. **URL parameters with sessionStorage**:
   ```typescript
   sessionStorage.setItem('importedDesign', JSON.stringify(json));
   router.push('/templates/new?import=true');
   ```

3. **React Context**: Rejected as overly complex for temporary data

**Implementation**: Use router state as it's cleaner and doesn't require storage APIs

### 4. Editor Integration

**Decision**: Detect imported design on mount and load it into Unlayer

**Rationale**:
- Editor component needs to check for imported design when initialized
- Load design using Unlayer's `loadDesign()` method
- Clear imported data after loading to prevent re-loading on navigation

**Implementation Pattern**:
```typescript
// In template editor component
useEffect(() => {
  if (emailEditorRef.current && importedDesign) {
    emailEditorRef.current.loadDesign(importedDesign);
    // Clear imported design from state
  }
}, [emailEditorRef.current, importedDesign]);
```

### 5. File Size Validation

**Decision**: 5 MB maximum file size

**Rationale**:
- Unlayer JSON files are typically <1 MB
- 5 MB provides ample headroom for complex designs
- Prevents accidentally uploading wrong files (images, videos, etc.)
- Fast to validate client-side

**Implementation**:
```typescript
const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5 MB

if (file.size > MAX_JSON_SIZE) {
  showError('File size exceeds maximum limit of 5 MB');
  return;
}
```

### 6. Error Handling Strategy

**Decision**: Client-side validation with clear error messages

**Rationale**:
- No backend to return errors from
- Validation can happen immediately after file selection
- User gets instant feedback

**Error Categories**:
1. **Wrong file type**: Not a .json file
2. **Invalid JSON**: Syntax errors in JSON
3. **Invalid structure**: Missing required Unlayer properties
4. **File too large**: Exceeds 5 MB limit

**Implementation Pattern**:
```typescript
try {
  // Read file
  const content = await readFile(file);

  // Parse JSON
  const json = JSON.parse(content);

  // Validate structure
  if (!isValidUnlayerDesign(json)) {
    throw new Error('File does not contain valid Unlayer design data');
  }

  // Validate size
  if (file.size > MAX_JSON_SIZE) {
    throw new Error('File size exceeds maximum limit of 5 MB');
  }

  // Success - redirect to editor
  router.push('/templates/new', { state: { importedDesign: json } });

} catch (error) {
  if (error instanceof SyntaxError) {
    showError('Invalid JSON format');
  } else {
    showError(error.message);
  }
}
```

### 7. User Experience Flow

**Decision**: Modal → Upload → Validate → Redirect to Editor → Name & Save

**Rationale**:
- Keeps import flow simple and focused
- User can review/edit design before saving
- Template name is set in editor (where user can preview design)
- No need for multi-step wizard in modal

**Flow Diagram**:
```
Templates Page
    ↓ (click "Import Template")
Import Modal
    ↓ (upload JSON)
Client-side Validation
    ↓ (if valid)
Redirect to /templates/new
    ↓
Editor with Loaded Design
    ↓ (user enters name & saves)
Templates Page (with new template)
```

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React + shadcn/ui | 18.2 | UI components, modal dialog |
| Framework | Next.js App Router | 14.0+ | Routing, page structure |
| Editor | Unlayer Email Editor | Latest | Design editor integration |
| Validation | Native TypeScript | 5.3+ | JSON structure validation |
| State Management | Next.js Router State | Built-in | Passing JSON to editor |
| Testing | Jest/Vitest + React Testing Library | Latest | Unit/integration tests |

## Open Questions Resolved

1. ~~How to handle JSON validation?~~ → **Client-side with type guards**
2. ~~Where to store JSON during import?~~ → **Router state (temporary)**
3. ~~When does user name the template?~~ → **In editor after design loads**
4. ~~Need backend API?~~ → **No - purely client-side flow**
5. ~~Maximum file size?~~ → **5 MB (generous for JSON)**

## Comparison to ZIP Approach

| Aspect | ZIP Approach | JSON Approach | Winner |
|--------|-------------|---------------|--------|
| Complexity | High (extraction, S3, path replacement) | Low (just validation) | **JSON** |
| Dependencies | jszip, AWS SDK | None | **JSON** |
| Backend Required | Yes (API routes, S3 operations) | No | **JSON** |
| Configuration | S3 credentials needed | None | **JSON** |
| File Size | 20 MB (images included) | 5 MB (JSON only) | Depends |
| Setup Time | ~4-5 days | ~1-2 days | **JSON** |
| User Flow | Modal → Upload → Wait → Success | Modal → Upload → Editor | **JSON** |
| Error Scenarios | Many (ZIP, S3, paths, DB) | Few (JSON, structure) | **JSON** |

**Conclusion**: JSON import is significantly simpler and faster to implement while still delivering the core value of importing pre-designed templates.

## Next Steps (Phase 1)

- [x] Confirm JSON validation approach
- [x] Confirm editor integration approach
- [x] Confirm no backend/S3 needed
- [ ] Update data-model.md (no schema changes needed)
- [ ] Update quickstart.md (JSON import workflow)
- [ ] Create tasks.md (simplified task list)
