# Quickstart: PostCraft Local Studio

**Branch**: `001-local-studio-dashboard` | **Date**: 2025-10-18

Get started with PostCraft Local Studio in 5 minutes. This guide covers installation, setup, and your first email template.

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL account with PostgreSQL database
- Basic understanding of email templates and merge tags

---

## Installation

```bash
# Install PostCraft package
npm install postcraft
# or
yarn add postcraft
```

---

## Configuration

### 1. Create Environment File

Create a `.env` file in your project root:

```bash
# .env
POSTCRAFT_DATABASE_URL=postgresql://user:password@host/database?sslmode=require
POSTCRAFT_PORT=3579
```

**Environment Variables**:
- `POSTCRAFT_DATABASE_URL` (required): PostgreSQL PostgreSQL connection string
- `POSTCRAFT_PORT` (optional): Preferred server port (default: 3579)

### 2. Run Database Migrations

Initialize the database schema:

```bash
npm run postcraft:db:push
# or
yarn postcraft:db:push
# or use npx directly
npx postcraft db:push
```

This creates the `templates` and `template_variables` tables in your PostgreSQL database.

---

## Start the Local Studio

### Launch the Dashboard

```bash
npm run studio
# or
yarn studio
```

You should see:

```
PostCraft Studio running at http://localhost:3579
Database connected: postgresql://...
Press Ctrl+C to stop
```

**Note**: If port 3579 is occupied, PostCraft will automatically use the next available port (3580, 3581, etc.) and notify you.

### Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3579
```

You'll see the PostCraft dashboard with a sidebar navigation and Templates section.

---

## Create Your First Template

### Step 1: Navigate to Templates

1. Click **Templates** in the sidebar (or navigate to `/templates`)
2. You'll see an empty state with a "Create New Template" button

### Step 2: Create a New Template

1. Click **Create New Template**
2. The template editor will load (react-email-editor)
3. Use the drag-and-drop interface to design your email:
   - Add text blocks, images, buttons, etc.
   - Customize colors, fonts, and spacing

### Step 3: Add Merge Tag Variables

1. In the editor, click the **Merge Tags** button in the toolbar
2. Add a merge tag (e.g., `{{NAME}}`, `{{ORDER_ID}}`)
3. The merge tag will appear in your email content as a placeholder

### Step 4: Configure Variable Metadata

After adding merge tags, configure their metadata in the Variables panel:

| Variable | Type | Fallback Value | Required |
|----------|------|----------------|----------|
| NAME | string | "Customer" | No |
| ORDER_ID | string | - | Yes |

**Variable Types**:
- `string`: Text values (e.g., "John Doe")
- `number`: Numeric values (e.g., 42)
- `boolean`: true/false values
- `date`: Date values (ISO 8601 format)

### Step 5: Save the Template

1. Enter a template name (e.g., `order-confirmation`)
2. Click **Save Template**
3. You'll be redirected to the template list
4. Your template now appears in the list

---

## Export Template as HTML

### Copy or Download HTML

1. Navigate to the template list (`/templates`)
2. Click the **Export** button on your template card
3. Choose an export option:
   - **Copy to Clipboard**: Copies HTML to clipboard for manual integration
   - **Download**: Downloads HTML file to your computer

The exported HTML includes:
- Inline styles (ready for email clients)
- Merge tags preserved as `{{VARIABLE_NAME}}`

---

## Programmatic Rendering with SDK

### Basic Usage

```typescript
// app/emails/send-order-confirmation.ts
import { PostCraft } from 'postcraft'

const postcraft = new PostCraft()

// Render template with variables
const html = await postcraft.templates.render('order-confirmation', {
  NAME: 'Alice Johnson',
  ORDER_ID: 'ORD-12345'
})

console.log(html)
// Output: <html>Hello Alice Johnson, your order ORD-12345...</html>
```

### Error Handling

```typescript
import {
  PostCraft,
  TemplateNotFoundError,
  TemplateVariableTypeError,
  RequiredVariableMissingError
} from 'postcraft'

const postcraft = new PostCraft()

try {
  const html = await postcraft.templates.render('order-confirmation', {
    NAME: 'Bob',
    ORDER_ID: 'ORD-67890'
  })
  // Use rendered HTML (send via email service, etc.)
} catch (error) {
  if (error instanceof TemplateNotFoundError) {
    console.error(`Template not found: ${error.templateName}`)
  } else if (error instanceof TemplateVariableTypeError) {
    console.error(
      `Type mismatch for ${error.variableName}: expected ${error.expectedType}, got ${error.providedType}`
    )
  } else if (error instanceof RequiredVariableMissingError) {
    console.error(`Missing required variable: ${error.variableName}`)
  }
}
```

### Type Validation

PostCraft validates variable types at runtime:

```typescript
// Template has variable AGE with type 'number'

// ✅ Correct usage
await postcraft.templates.render('user-profile', {
  NAME: 'Charlie',
  AGE: 28  // number type matches
})

// ❌ Throws TemplateVariableTypeError
await postcraft.templates.render('user-profile', {
  NAME: 'Charlie',
  AGE: '28'  // string provided for number type
})
// Error: Variable "AGE" expected type number, got string
```

---

## Common Workflows

### Edit Existing Template

1. Navigate to `/templates`
2. Click **Edit** on the template card
3. Make changes in the editor
4. Update variable metadata if needed
5. Click **Save** to persist changes

**Unsaved Changes Warning**: If you navigate away without saving, you'll see a confirmation dialog to prevent data loss.

### Delete Template

1. Navigate to `/templates`
2. Click **Delete** on the template card
3. Confirm deletion in the dialog
4. Template and all associated variables are permanently removed

**Note**: Deletion is permanent and cannot be undone.

### Pagination for Large Template Lists

When you have more than 20 templates:
- Page numbers appear at the bottom of the template list
- Click **Next**, **Previous**, or a specific page number
- Templates are sorted by last updated (newest first)

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save template | `Cmd+S` (Mac) / `Ctrl+S` (Windows) |
| Undo in editor | `Cmd+Z` / `Ctrl+Z` |
| Redo in editor | `Cmd+Shift+Z` / `Ctrl+Shift+Z` |
| Navigate templates | `Arrow Keys` |
| Close dialog | `Escape` |

---

## Troubleshooting

### Server won't start

**Error**: `Port 3579 already in use`
- **Solution**: PostCraft will auto-detect the next available port. Check the console output for the actual port being used (e.g., 3580).

**Error**: `Database connection failed`
- **Solution**: Verify your `POSTCRAFT_DATABASE_URL` in `.env` is correct and the database is accessible.

### Template not saving

**Error**: `Template name already exists`
- **Solution**: Template names must be unique. Choose a different name or delete the existing template.

**Error**: Editor shows "Save failed, retry?"
- **Solution**: Check your database connection. Click **Retry** to attempt saving again. Your changes are preserved in memory until saved successfully.

### SDK rendering issues

**Error**: `Template "my-template" not found`
- **Solution**: Verify the template name matches exactly (case-sensitive) in the studio. Templates created in the studio are immediately available to the SDK.

**Error**: `Required variable "ORDER_ID" is missing and has no fallback`
- **Solution**: Provide the missing variable in your `render()` call, or set a fallback value in the studio variable metadata.

---

## Next Steps

- **Advanced Variables**: Explore boolean and date type variables for dynamic content
- **Performance Optimization**: Review pagination settings for large template collections
- **Integration**: Connect PostCraft SDK to your email sending service (SendGrid, AWS SES, etc.)
- **Production Deployment**: Transition from `drizzle-kit push` to versioned migrations for production safety

---

## Support

For issues and feature requests, visit the PostCraft repository issues page or consult the full documentation.

**Security Note**: PostCraft binds to `127.0.0.1` (localhost only) by design. Do not attempt to access the studio from external network addresses.
