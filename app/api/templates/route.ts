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
 * Creates a new email template with optional merge tag variables.
 *
 * Request Body:
 * ```json
 * {
 *   "name": "welcome-email",
 *   "content": { /* react-email-editor design JSON * /},
 *   "variables": [
 *     { "key": "NAME", "type": "string", "isRequired": true },
 *     { "key": "DISCOUNT", "type": "number", "fallbackValue": "0", "isRequired": false }
 *   ]
 * }
 * ```
 *
 * Response (201 Created):
 * ```json
 * {
 *   "id": 1,
 *   "name": "welcome-email",
 *   "content": { ... },
 *   "createdAt": "2025-10-18T00:00:00Z",
 *   "updatedAt": "2025-10-18T00:00:00Z",
 *   "variables": [
 *     { "id": 1, "templateId": 1, "key": "NAME", "type": "string", "isRequired": true, ... }
 *   ]
 * }
 * ```
 *
 * Error Responses:
 * - 400 Bad Request: Invalid template name or missing content
 * - 409 Conflict: Template name already exists
 * - 500 Server Error: Database error
 *
 * @param request - NextRequest with JSON body
 * @returns NextResponse with created template or error
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
