import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { templates, templateVariables } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/templates/[id] - Get Single Template with Variables
 * Returns a single template with all associated variables
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
 * Updates template content and variables in a transaction
 */
export async function PUT(
  request: NextRequest,
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

    const body = await request.json();
    const { content, variables } = body;

    // Validate required fields
    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { error: "Template content is required and must be a JSON object" },
        { status: 400 }
      );
    }

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
