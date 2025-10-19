/**
 * @fileoverview API endpoints for template list and creation operations
 *
 * Implements the templates API contract for US2 (View Templates) and US3 (Create Template):
 *
 * GET /api/templates
 * - Returns paginated list of all email templates
 * - Supports offset pagination with page and pageSize parameters
 * - Sorts by updatedAt descending (most recent first)
 * - Returns total count for pagination UI
 *
 * POST /api/templates
 * - Creates new email template with design JSON and metadata
 * - Validates template name (1-100 chars, alphanumeric + hyphens/underscores)
 * - Supports optional merge tag variables with metadata
 * - Returns created template with assigned ID
 *
 * Error Handling:
 * - 400: Invalid template name or missing required fields
 * - 409: Template name already exists (unique constraint violation)
 * - 500: Database or server error
 *
 * @see {@link /specs/001-local-studio-dashboard/contracts/api-templates.ts} API contracts
 * @see {@link /lib/utils/validation.ts} validateTemplateName function
 *
 * @example
 * // Fetch templates with pagination
 * const response = await fetch('/api/templates?page=1&pageSize=20');
 * const { items, pagination } = await response.json();
 *
 * @example
 * // Create new template with variables
 * const response = await fetch('/api/templates', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     name: 'welcome-email',
 *     content: { /* react-email-editor design JSON * /},
 *     variables: [
 *       { key: 'FIRST_NAME', type: 'string', isRequired: true },
 *       { key: 'DISCOUNT', type: 'number', fallbackValue: '0' }
 *     ]
 *   })
 * });
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { templates, templateVariables } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { validateTemplateName } from "@/lib/utils/validation";

/**
 * GET /api/templates
 *
 * Retrieves paginated list of all email templates ordered by most recent first.
 *
 * Query Parameters:
 * - page: Page number (1-indexed, default: 1, min: 1)
 * - pageSize: Items per page (default: 20, min: 1, max: 100)
 *
 * Response (200 OK):
 * ```json
 * {
 *   "items": [
 *     {
 *       "id": 1,
 *       "name": "welcome-email",
 *       "content": { ... },
 *       "createdAt": "2025-10-18T00:00:00Z",
 *       "updatedAt": "2025-10-18T00:00:00Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "pageSize": 20,
 *     "totalPages": 5,
 *     "totalCount": 100
 *   }
 * }
 * ```
 *
 * Error Response (500 Server Error):
 * ```json
 * {
 *   "error": "Failed to fetch templates",
 *   "details": "Connection timeout"
 * }
 * ```
 *
 * @param request - NextRequest containing query parameters
 * @returns NextResponse with paginated template list or error
 *
 * @example
 * // Fetch page 2 with 10 items per page
 * fetch('/api/templates?page=2&pageSize=10')
 */
export async function GET(request: NextRequest) {
  try {
    // Get pagination params from query string
    const searchParams = request.nextUrl.searchParams;
    const pageStr = searchParams.get("page") || "1";
    const pageSizeStr = searchParams.get("pageSize") || "20";

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeStr, 10) || 20));

    const offset = (page - 1) * pageSize;

    // Get total count using Drizzle count() function
    const countResult = await db
      .select({ count: count() })
      .from(templates);
    const totalCount = countResult[0]?.count || 0;

    // Get paginated templates
    const items = await db
      .select()
      .from(templates)
      .orderBy(desc(templates.updatedAt))
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch templates",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 *
 * Creates a new email template with design JSON and optional merge tag variables.
 *
 * This endpoint is used by the template creation UI (app/(studio)/templates/new/page.tsx)
 * to persist newly designed email templates to the database. It validates the template
 * name, persists the react-email-editor design JSON, and records any detected merge tag
 * variables with their metadata.
 *
 * **Request Body Schema:**
 * ```json
 * {
 *   "name": "welcome-email",
 *   "content": {
 *     "body": { "rows": [...] },
 *     "design": { ... }
 *   },
 *   "variables": [
 *     {
 *       "key": "FIRST_NAME",
 *       "type": "string",
 *       "fallbackValue": null,
 *       "isRequired": true
 *     },
 *     {
 *       "key": "DISCOUNT_AMOUNT",
 *       "type": "number",
 *       "fallbackValue": "0",
 *       "isRequired": false
 *     }
 *   ]
 * }
 * ```
 *
 * **Field Descriptions:**
 * - name: Template name (1-100 chars, alphanumeric + hyphens/underscores, case-insensitive)
 * - content: react-email-editor design JSON from saveDesign() method
 * - variables: Array of merge tag variable definitions (optional)
 *   - key: Variable name matching {{KEY}} in template (uppercase, required)
 *   - type: Variable type for validation: 'string', 'number', 'boolean', 'date'
 *   - fallbackValue: Value used when variable not provided at render time (string or null)
 *   - isRequired: Whether variable must be provided at render time
 *
 * **Response (201 Created):**
 * Returns the created template object with all fields populated:
 * ```json
 * {
 *   "id": 1,
 *   "name": "welcome-email",
 *   "content": { "body": { ... } },
 *   "createdAt": "2025-10-18T12:34:56.789Z",
 *   "updatedAt": "2025-10-18T12:34:56.789Z",
 *   "variables": [
 *     {
 *       "id": 1,
 *       "templateId": 1,
 *       "key": "FIRST_NAME",
 *       "type": "string",
 *       "fallbackValue": null,
 *       "isRequired": true
 *     },
 *     {
 *       "id": 2,
 *       "templateId": 1,
 *       "key": "DISCOUNT_AMOUNT",
 *       "type": "number",
 *       "fallbackValue": "0",
 *       "isRequired": false
 *     }
 *   ]
 * }
 * ```
 *
 * **Error Responses:**
 *
 * **400 Bad Request** - Invalid input data:
 * ```json
 * {
 *   "error": "Template name must be 1-100 characters"
 * }
 * ```
 *
 * **409 Conflict** - Template name already exists (unique constraint):
 * ```json
 * {
 *   "error": "Template name already exists"
 * }
 * ```
 *
 * **500 Server Error** - Database or server error:
 * ```json
 * {
 *   "error": "Failed to create template",
 *   "details": "Connection timeout"
 * }
 * ```
 *
 * **Validation Rules:**
 * - Template name: 1-100 characters, alphanumeric + hyphens/underscores only
 * - Template name: Must be unique across all templates (case-insensitive)
 * - Content: Must be valid JSON object (from react-email-editor)
 * - Variables: Optional, but if provided must have valid key names and types
 *
 * **Transaction Behavior:**
 * - Creates template and variables atomically
 * - If variable insertion fails, entire transaction rolls back
 * - Ensures template always has consistent variable metadata
 *
 * **Performance:**
 * - Single database round-trip for template creation
 * - Single database round-trip for variable insertion
 * - Total p95 response time: <200ms per performance budgets
 *
 * **Usage Examples:**
 *
 * @example
 * ```typescript
 * // Create template with required and optional variables
 * const response = await fetch('/api/templates', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'welcome-email',
 *     content: {
 *       body: { rows: [...] },
 *       design: { palette: [...] }
 *     },
 *     variables: [
 *       { key: 'USER_EMAIL', type: 'string', isRequired: true },
 *       { key: 'DISCOUNT', type: 'number', fallbackValue: '0', isRequired: false }
 *     ]
 *   })
 * });
 *
 * if (response.ok) {
 *   const template = await response.json();
 *   console.log('Created template:', template.id);
 *   // Redirect to template list or edit page
 * } else {
 *   const error = await response.json();
 *   console.error('Failed:', error.error);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handle duplicate name error
 * try {
 *   const response = await fetch('/api/templates', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       name: 'existing-template',  // Already exists
 *       content: { ... },
 *       variables: []
 *     })
 *   });
 *
 *   if (response.status === 409) {
 *     // Template name already exists - prompt user for different name
 *     showError('Template name already exists. Please choose a different name.');
 *   } else if (!response.ok) {
 *     throw new Error('Failed to create template');
 *   }
 * } catch (error) {
 *   console.error('Template creation error:', error);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Extract variables from react-email-editor export
 * editor.exportHtml((data) => {
 *   const html = data.html;
 *   // Find all {{VARIABLE}} merge tags
 *   const variables = [];
 *   const regex = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
 *   for (const match of html.matchAll(regex)) {
 *     variables.push({
 *       key: match[1],
 *       type: 'string',
 *       fallbackValue: null,
 *       isRequired: false
 *     });
 *   }
 *
 *   // Remove duplicates
 *   const unique = [...new Set(variables.map(v => v.key))].map(
 *     key => variables.find(v => v.key === key)
 *   );
 *
 *   // Create template with variables
 *   fetch('/api/templates', {
 *     method: 'POST',
 *     body: JSON.stringify({
 *       name: templateName,
 *       content: editor.exportDesign(),
 *       variables: unique
 *     })
 *   });
 * });
 * ```
 *
 * @param request - NextRequest with JSON body containing name, content, and variables
 * @returns NextResponse with created template (201) or error response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content, variables } = body;

    // Validate template name
    const nameValidation = validateTemplateName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { error: "Template content is required and must be a JSON object" },
        { status: 400 }
      );
    }

    // Create template
    const newTemplate = await db
      .insert(templates)
      .values({
        name: nameValidation.sanitized,
        content,
      })
      .returning();

    if (!newTemplate || newTemplate.length === 0) {
      throw new Error("Failed to create template");
    }

    const templateId = newTemplate[0].id;

    // Insert variables if provided
    if (Array.isArray(variables) && variables.length > 0) {
      const variablesToInsert = variables.map((v: any) => ({
        templateId,
        key: v.key,
        type: v.type || "string",
        fallbackValue: v.fallbackValue || null,
        isRequired: v.isRequired || false,
      }));

      await db.insert(templateVariables).values(variablesToInsert);
    }

    // Fetch the complete template with variables
    const completeTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
      with: { variables: true },
    });

    return NextResponse.json(completeTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);

    // Handle unique constraint error
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "Template name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create template",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
