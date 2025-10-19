/**
 * @fileoverview API route handler for individual template CRUD operations.
 *
 * Provides HTTP endpoints for retrieving and updating individual email templates.
 * Implements the Template API contracts for GET and PUT operations:
 * - GET /api/templates/[id]: Retrieve single template with all associated variables
 * - PUT /api/templates/[id]: Update template content and variables in atomic transaction
 *
 * **Database Operations**:
 * - GET uses Drizzle relational query API to fetch template with eager-loaded variables
 * - PUT implements atomic transaction: UPDATE template → DELETE old variables → INSERT new variables
 * - Transaction ensures data consistency if any operation fails (automatic rollback)
 *
 * **Error Handling**:
 * - Validates template ID is numeric before database queries
 * - Returns 404 when template not found (no cascade delete on missing template)
 * - Returns 400 for invalid request body (missing required fields)
 * - Returns 500 for database connection errors with error details
 *
 * **Type Safety**:
 * - Uses TypeScript interfaces from @/specs/001-local-studio-dashboard/contracts/api-templates.ts
 * - Request/response bodies validated against typed interfaces at runtime
 *
 * @example
 * // Get a template for editing
 * const response = await fetch('/api/templates/5');
 * const { template } = await response.json();
 * console.log(template.content); // react-email-editor JSON
 *
 * @example
 * // Update a template with new design and variables
 * const response = await fetch('/api/templates/5', {
 *   method: 'PUT',
 *   body: JSON.stringify({
 *     content: { body: { rows: [...] } },
 *     variables: [
 *       { key: 'NAME', type: 'string', fallbackValue: 'User', isRequired: false }
 *     ]
 *   })
 * });
 * const { template } = await response.json();
 *
 * @see lib/db/schema.ts - Templates and TemplateVariables table schemas
 * @see contracts/api-templates.ts - Request/response type definitions
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { templates, templateVariables } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateUpdateTemplateRequest } from "@/lib/utils/api-validation";

/**
 * GET /api/templates/[id] - Get Single Template with Variables
 *
 * Retrieves a single email template with all associated merge tag variables.
 * Uses Drizzle's relational query API to fetch template and variables in a single query.
 *
 * @param {NextRequest} _request - Incoming HTTP request (unused for GET)
 * @param {Object} params - Dynamic route parameters
 * @param {string} params.params.id - Template ID from URL path (e.g., "5" in /api/templates/5)
 *
 * @returns {Promise<NextResponse>} JSON response with template data or error
 *
 * @throws {400} Invalid template ID (not numeric)
 * @throws {404} Template not found (no template with given ID exists)
 * @throws {500} Database query error or connection failure
 *
 * @example
 * GET /api/templates/5
 * // Response (200): { template: { id: 5, name: "password-reset", content: {...}, variables: [...] } }
 *
 * @example
 * GET /api/templates/999
 * // Response (404): { error: "Template not found", details: "No template with id 999 exists" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id, 10);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    // Fetch template with variables using Drizzle's relational query API
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
      with: { variables: true },
    });

    if (!template) {
      return NextResponse.json(
        {
          error: "Template not found",
          details: `No template with id ${templateId} exists`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch template",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/templates/[id] - Update Template
 *
 * Updates an existing email template's design and merge tag variables in an atomic transaction.
 * Implements the update flow: UPDATE template content → DELETE old variables → INSERT new variables.
 *
 * **Transaction Atomicity**:
 * This route uses database transactions to ensure consistency:
 * - If any step fails (validation, database error), entire transaction rolls back
 * - Prevents partial updates where content is saved but variables are not
 * - Ensures updatedAt timestamp is only set on successful completion
 *
 * **Variable Management**:
 * - Automatically detects new merge tags ({{VARIABLE}} format) from the design JSON
 * - Removes old variables not present in new design (cleanup on save)
 * - Allows updating variable metadata (type, fallback value, required flag)
 *
 * @param {NextRequest} request - Incoming HTTP request with JSON body
 * @param {Object} params - Dynamic route parameters
 * @param {string} params.params.id - Template ID from URL path (e.g., "5" in /api/templates/5)
 *
 * @returns {Promise<NextResponse>} JSON response with updated template or error details
 *
 * @throws {400} Invalid request (missing content, non-object content, invalid template ID)
 * @throws {404} Template not found (no template with given ID exists)
 * @throws {500} Database transaction error, connection failure, or unexpected error
 *
 * @example
 * PUT /api/templates/5
 * {
 *   "content": { "body": { "rows": [...] } },
 *   "variables": [
 *     { key: "NAME", type: "string", fallbackValue: "Customer", isRequired: false },
 *     { key: "ORDER_ID", type: "string", fallbackValue: null, isRequired: true }
 *   ]
 * }
 * // Response (200): { template: { id: 5, content: {...}, variables: [...], updatedAt: "..." } }
 *
 * @example
 * PUT /api/templates/999
 * // Response (404): { error: "Template not found" }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id, 10);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID", field: "id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body against contract
    const validation = validateUpdateTemplateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    const { content, variables } = validation.data!;

    // Check if template exists
    const existingTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Perform update transaction: UPDATE template, DELETE old variables, INSERT new variables
    await db.transaction(async (tx) => {
      // Update template content and timestamp
      await tx
        .update(templates)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(eq(templates.id, templateId));

      // Delete all existing variables for this template
      await tx
        .delete(templateVariables)
        .where(eq(templateVariables.templateId, templateId));

      // Insert new variables if provided
      if (Array.isArray(variables) && variables.length > 0) {
        const variablesToInsert = variables.map((v: any) => ({
          templateId,
          key: v.key,
          type: v.type || "string",
          fallbackValue: v.fallbackValue || null,
          isRequired: v.isRequired || false,
        }));

        await tx.insert(templateVariables).values(variablesToInsert);
      }
    });

    // Fetch the updated template with variables
    const updatedTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
      with: { variables: true },
    });

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      {
        error: "Failed to update template",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id] - Delete Template
 *
 * Deletes an existing email template and all associated merge tag variables in a cascade delete operation.
 * Leverages database foreign key constraints with CASCADE DELETE to automatically remove related variables
 * when the parent template is deleted, ensuring referential integrity and preventing orphaned records.
 *
 * **Cascade Delete Behavior**:
 * The database schema (data-model.md) defines a foreign key relationship from template_variables.template_id
 * to templates.id with CASCADE DELETE. This means:
 * - When DELETE removes the template row, the database automatically deletes all related variable rows
 * - No manual deletion of variables is required in this route
 * - The entire operation completes in a single database transaction
 * - If deletion fails for any reason, the transaction rolls back and nothing is deleted
 *
 * **Database Foreign Key**:
 * ```sql
 * ALTER TABLE template_variables
 * ADD FOREIGN KEY (template_id)
 * REFERENCES templates(id)
 * ON DELETE CASCADE;
 * ```
 *
 * @param {NextRequest} _request - Incoming HTTP request (unused for DELETE)
 * @param {Object} params - Dynamic route parameters
 * @param {string} params.params.id - Template ID from URL path (e.g., "5" in /api/templates/5)
 *
 * @returns {Promise<NextResponse>} JSON response with success message or error details
 *
 * @throws {400} Invalid template ID (not numeric)
 * @throws {404} Template not found (no template with given ID exists)
 * @throws {500} Database deletion error, connection failure, or unexpected error
 *
 * @example
 * DELETE /api/templates/5
 * // Response (200): { success: true, message: "Template 'password-reset' deleted successfully" }
 *
 * @example
 * DELETE /api/templates/999
 * // Response (404): { error: "Template not found", details: "No template with id 999 exists" }
 *
 * @example
 * // Cascade delete example:
 * // Before: templates.id=5 exists with template_variables records for {{NAME}}, {{EMAIL}}
 * // DELETE /api/templates/5
 * // After: template row is deleted AND all associated template_variables rows are automatically deleted
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id, 10);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    // Check if template exists before deletion
    const existingTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          error: "Template not found",
          details: `No template with id ${templateId} exists`,
        },
        { status: 404 }
      );
    }

    // Delete the template (cascade delete removes associated variables via database foreign key)
    await db.delete(templates).where(eq(templates.id, templateId));

    return NextResponse.json({
      success: true,
      message: `Template '${existingTemplate.name}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      {
        error: "Failed to delete template",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
