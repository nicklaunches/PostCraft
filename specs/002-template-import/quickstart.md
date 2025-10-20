# Quickstart: Import Unlayer JSON Templates

**Feature**: Template Import from Unlayer JSON
**Last Updated**: October 19, 2025

## Overview

The template import feature allows you to import Unlayer design JSON either by **pasting it directly** or **uploading a JSON file**. This is ideal for:

- Importing templates from Unlayer exports or backups
- Migrating existing template designs between environments
- Sharing templates between team members or projects (copy-paste JSON)
- Restoring templates from JSON backups
- Quick testing with JSON snippets

## Prerequisites

### 1. Prepare Your JSON File

Your JSON file must be a valid Unlayer design export containing the design structure.

**Requirements**:
- ✅ Must be a valid JSON file (.json extension)
- ✅ Must contain Unlayer design structure (body, counters, schemaVersion properties)
- ✅ Maximum file size: 5 MB
- ✅ Must be a valid JSON format (no syntax errors)

**How to Export from Unlayer**:
1. In Unlayer editor, use the export design function
2. Save the JSON file to your computer
3. The exported file will have a .json extension

## Import Steps

### Step 1: Navigate to Templates Page

1. Start PostCraft studio:
   ```bash
   npm run postcraft
   ```

2. Open your browser and go to: `http://localhost:3579/templates`

### Step 2: Open Import Modal

1. Click the **"Import Template"** button (located to the left of "+ Create Template")
2. The import modal will open with two input options:
   - **Textarea**: For pasting JSON directly
   - **File Upload**: For uploading a .json file

### Step 3: Choose Your Import Method

**Option A: Paste JSON (Quick & Easy)**

1. Copy your Unlayer JSON to clipboard
2. Paste it into the textarea in the modal
3. Click **"Import"** button

**Option B: Upload JSON File**

1. Click the **file upload area** or drag-and-drop your JSON file
2. The system will read and validate the file
3. Click **"Import"** button

**Note**: If you provide both pasted JSON and a file, the **file takes precedence**.

### Step 4: Edit in Editor

- Upon successful validation, you'll be redirected to `/templates/new`
- The Unlayer editor will open with your imported design loaded
- All design elements from your JSON will be visible and editable

### Step 5: Name and Save Template

1. Enter a **template name** in the editor
2. Make any desired edits to the design
3. Click **"Save Template"** to save it to your library
4. You'll be redirected to the templates list

## Example: Importing a Template

### Method 1: Paste JSON (Recommended for Quick Sharing)

1. Export a design from Unlayer editor (or get JSON from a colleague)
2. Copy the JSON content to clipboard
3. Open `http://localhost:3579/templates`
4. Click "Import Template"
5. Paste JSON into the textarea
6. Click "Import"
7. ✅ Editor opens with your design loaded

### Method 2: Upload JSON File

1. Export a design from Unlayer and save as `my-template.json`
2. Open `http://localhost:3579/templates`
3. Click "Import Template"
4. Upload `my-template.json` file
5. Click "Import"
6. ✅ Editor opens with your design loaded

### After Import (Both Methods)

1. In the editor, enter a name like "Welcome Email"
2. Make any edits if needed
3. Click "Save Template"
4. ✅ Done! Template is in your library

## Using Imported Templates with SDK

Once imported and saved, templates can be used like any other PostCraft template:

```typescript
import { PostCraft } from 'postcraft';

const postcraft = new PostCraft({
  databaseUrl: process.env.DATABASE_URL!,
});

// Render imported template
const html = await postcraft.render('Welcome Email', {
  NAME: 'Alice Johnson',
});

// Send email with rendered HTML
await sendEmail({
  to: 'alice@example.com',
  subject: 'Welcome!',
  html,
});
```

## Troubleshooting

### "Please upload a valid JSON file" Error

**Symptom**: Error when selecting a non-JSON file

**Solution**:
1. Verify file has .json extension
2. Ensure file was exported from Unlayer (not manually created)
3. Check file is not corrupted
4. Or use paste method instead of file upload

### "Please paste JSON or upload a file" Error

**Symptom**: Error when clicking Import with empty inputs

**Solution**:
1. Either paste JSON into the textarea OR upload a file
2. Both fields are optional but at least one must be provided

### "Invalid JSON format" Error

**Symptom**: Error after uploading JSON file or pasting content

**Solution**:
1. Open JSON file in a text editor and verify it's valid JSON
2. Use an online JSON validator (jsonlint.com)
3. Re-export from Unlayer if file is corrupted
4. Check for missing quotes, commas, or brackets

### "File does not contain valid Unlayer design data" Error

**Symptom**: JSON parses successfully but structure is invalid

**Solution**:
1. Verify the JSON file was exported from Unlayer editor
2. Check that the content contains required properties (body, counters, schemaVersion)
3. Don't manually edit Unlayer JSON files as structure is specific
4. Re-export from Unlayer to get fresh JSON

### "File size exceeds maximum limit of 5 MB" Error (File Upload)

**Symptom**: Error when selecting large JSON file

**Solution**:
1. Check JSON file size
2. Unlayer JSON files are typically <1 MB; if larger, file may be corrupted or include embedded data
3. Try re-exporting from Unlayer
4. Or use paste method with smaller sections

### Pasted Content Too Large Error

**Symptom**: Error when pasting very large JSON

**Solution**:
1. JSON content exceeds ~5 million characters
2. Use file upload instead
3. Or verify the JSON is a valid Unlayer export (shouldn't be that large)

### Editor Doesn't Load Design After Import

**Symptom**: Redirected to editor but design doesn't appear

**Possible Causes**:
1. **Browser Navigation**: User navigated back or refreshed page
2. **State Loss**: JSON data not properly passed to editor
3. **Editor Loading**: Unlayer editor not fully initialized

**Solution**:
1. Try importing again
2. Clear browser cache and retry
3. Check browser console for JavaScript errors

## Best Practices

### 1. Choose the Right Import Method

**Use Paste Method When:**
- ✅ Quickly sharing templates with team members (copy-paste in Slack/email)
- ✅ Testing template JSON snippets
- ✅ JSON is in clipboard already
- ✅ Working with small to medium-sized templates

**Use File Upload When:**
- ✅ Importing from saved backups
- ✅ Working with very large templates
- ✅ Importing multiple templates (can be done one-by-one)
- ✅ JSON is already saved as a file

### 2. Export Regularly for Backups

- Export your templates as JSON files regularly
- Store exports in version control or cloud storage
- Makes it easy to restore or migrate templates
- Can share via file or copy-paste the content

### 3. Use Semantic Template Names

Good names: ✅
- "Welcome Email - New User Onboarding"
- "Black Friday Sale 2025"
- "Monthly Newsletter - Tech Updates"

Avoid: ❌
- "template1"
- "email"
- "test"

### 4. Test Before Saving

Before saving imported template:
1. Review the design in the editor
2. Make any necessary edits
3. Preview the template
4. Test with sample data

### 5. Keep JSON Files Small

- Unlayer JSON files are typically <1 MB
- If files are larger, they may include unnecessary embedded data
- Re-export from Unlayer if file size seems unusual
- Paste method works well for typical templates

## Limitations

- **File Format**: Only accepts Unlayer JSON exports (not generic JSON or other email builder formats)
- **File Size**: Maximum 5 MB for files / ~5 million characters for pasted content
- **Manual Editing**: Don't manually edit Unlayer JSON files as they have a specific structure
- **Browser State**: If you close the editor without saving after import, the JSON is not persisted
- **Priority**: When both textarea and file are provided, file upload takes precedence

## Next Steps

- **Edit Imported Templates**: Make changes in the editor after import
- **Render with SDK**: Use `postcraft.render()` to populate merge tags and generate final HTML
- **Export Templates**: Download templates as JSON for backup or sharing (both file and copy-paste friendly)
- **Share with Team**: Share JSON files OR copy-paste JSON content directly in chat/email

## Support

If you encounter issues not covered in this guide:

1. Check PostCraft terminal logs for detailed error messages
2. Review the [Feature Specification](/specs/002-template-import/spec.md) for technical details
3. File an issue on GitHub with:
   - Error message (full text from UI or logs)
   - Import method used (paste vs file upload)
   - JSON file size and structure (don't share sensitive content)
   - PostCraft version (`npm list postcraft`)
   - Browser and version
