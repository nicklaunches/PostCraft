# GitHub Copilot Instructions for PostCraft

## Project Overview

PostCraft is a local-only email template studio built with Next.js, React, and the Unlayer Email Editor. It enables users to design, manage, and export email templates with built-in variable/merge tag support.

## Key Features

### Template Import (002-template-import)

Users can import pre-designed email templates from Unlayer JSON exports or backups.

**How it works:**
1. Users click "Import Template" button on the Templates page (/templates)
2. A modal opens with two input methods:
   - **Upload JSON file**: Select a .json file containing Unlayer design
   - **Paste JSON**: Paste raw JSON content directly
3. File upload takes precedence if both methods are used
4. Validation ensures:
   - File is valid JSON (.json extension, < 5 MB)
   - JSON contains valid Unlayer design structure (body, counters, schemaVersion)
   - Clear error messages for invalid inputs
5. On success, user is redirected to /templates/new with the imported design loaded in the editor
6. User can then name the template and save it to their library

**Key Files:**
- `lib/utils/unlayer-validation.ts` - JSON validation utilities
- `components/template-import-dialog.tsx` - Import dialog component
- `components/templates-header-client.tsx` - Header with import button
- `app/(studio)/templates/page.tsx` - Templates list page
- `app/(studio)/templates/new/page.tsx` - Template editor with import support

**Validation Functions:**
- `isValidUnlayerDesign()` - Type guard for Unlayer JSON structure
- `validateFile()` - Check file extension and size
- `validateTextareaContent()` - Check paste content size
- `parseAndValidateJSON()` - Parse and validate JSON structure
- `determineImportSource()` - Choose file or textarea (file priority)
- `VALIDATION_ERRORS` - User-friendly error messages

## Architecture

### Frontend Stack
- **Framework**: Next.js 14+ with App Router
- **UI**: React 18.2+ with shadcn/ui components
- **Editor**: Unlayer Email Editor (react-email-editor)
- **Styling**: TailwindCSS
- **Database**: Drizzle ORM with PostgreSQL
- **Validation**: TypeScript with type guards

### Project Structure
```
app/               - Next.js App Router pages
├── (studio)/      - Studio layout
│   └── templates/
│       ├── page.tsx                 - Templates list
│       ├── new/page.tsx             - Create/import templates
│       └── [id]/edit/page.tsx       - Edit templates
components/
├── template-import-dialog.tsx       - Import dialog
├── templates-header-client.tsx      - Header with buttons
├── template-editor.tsx              - Unlayer wrapper
├── variable-manager.tsx             - Variable config UI
├── template-list.tsx                - Templates grid
└── pages/template-page.tsx          - Unified template page
lib/
├── utils/
│   ├── unlayer-validation.ts       - JSON validation
│   ├── variable-detection.ts       - Extract merge tags
│   ├── variable-validation.ts      - Validate variables
│   └── api-validation.ts           - API request validation
└── db/                              - Database layer
```

## Development Guidelines

### Type Safety First
- Use TypeScript strict mode
- Create interfaces for all data structures
- Use type guards for runtime validation
- Export types from modules for reuse

### Component Patterns
- Use "use client" for interactive components
- Keep server components for data fetching
- Use React hooks for state management
- Use refs for imperative operations (e.g., editor.saveDesign)

### Validation Strategy
- **Client-side**: File type, size, JSON syntax, structure
- **Server-side**: Additional validation in API endpoints
- **Display**: Clear, actionable error messages
- **Prevention**: Disable controls during async operations

### Testing Approach
- Unit tests for validation functions
- Component tests for dialog interactions
- Integration tests for full import flow

### Documentation Requirements
- JSDoc on all exported functions
- File-level module documentation
- Clear comments for complex logic
- Example usage in docstrings

## Common Tasks

### Adding a New Input Method to Import Dialog
1. Update `template-import-dialog.tsx` to add new input
2. Add validation in `unlayer-validation.ts`
3. Update `determineImportSource()` to handle new source
4. Add error messages to `VALIDATION_ERRORS`
5. Test with various inputs

### Extending JSON Validation
1. Update `UnlayerDesign` interface if needed
2. Add validation logic to `isValidUnlayerDesign()`
3. Add error constant to `VALIDATION_ERRORS`
4. Update component to display error
5. Test with invalid JSON files

### Template Editor Integration
- Use `ref` to access editor instance
- Call `editor.loadDesign(json)` to load imported design
- Call `editor.saveDesign(callback)` to export design
- Call `editor.exportHtml(callback)` to get production HTML

## Constitution Principles

All code follows these principles:

1. **Type Safety First** - Strict TypeScript, interfaces, type guards
2. **shadcn/ui Consistency** - Use only shadcn/ui components
3. **Test-Driven Development** - Tests for validation and flows
4. **UX State Completeness** - Handle loading, success, error, empty states
5. **Database Schema as Code** - All schemas in Drizzle definitions
6. **Performance Budgets** - 2-second max for 5 MB JSON files
7. **Security by Default** - File validation, size limits, input sanitization
8. **JSDoc Documentation** - All exports documented with examples

## Environment Variables

Required for local development:
- `DATABASE_URL` - PostgreSQL connection string
- `POSTCRAFT_UNLAYER_PROJECT_ID` - Unlayer project ID
- `POSTCRAFT_UNLAYER_SIGNATURE` - Unlayer API signature (optional)

## Testing the Import Feature

### Manual Testing Checklist

1. **Upload Valid JSON**
   - Click "Import Template" button
   - Upload `examples/sample-unlayer-template.json`
   - Verify redirects to /templates/new
   - Verify design loads in editor

2. **Paste Valid JSON**
   - Click "Import Template" button
   - Paste JSON from `examples/sample-unlayer-template.json`
   - Verify redirects to /templates/new
   - Verify design loads in editor

3. **File Priority**
   - Upload a file AND paste JSON
   - Verify file is used (not paste)

4. **Error Cases**
   - Upload non-JSON file → should show error
   - Upload oversized file (> 5MB) → should show error
   - Paste invalid JSON → should show error
   - Paste non-Unlayer JSON → should show error
   - Try import with empty inputs → should show error

5. **Save Template**
   - After successful import
   - Enter template name
   - Click save
   - Verify template appears in list
   - Verify template can be edited/used

## Common Issues & Fixes

### JSON Not Loading in Editor
- Ensure JSON has required properties: body, counters, schemaVersion
- Check browser console for parse errors
- Verify sessionStorage is clearing after load

### Dialog Not Opening
- Check `templates-header-client.tsx` state management
- Verify `template-import-dialog.tsx` open prop is true
- Check browser console for React errors

### Validation Errors Not Showing
- Check `VALIDATION_ERRORS` messages
- Verify error state is being set
- Check form has error display div

### File Upload Not Working
- Verify FileReader API support
- Check file size before reading
- Check accept=".json" attribute

## Resources

- [Unlayer Documentation](https://react-email-editor.readthedocs.io/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team)

