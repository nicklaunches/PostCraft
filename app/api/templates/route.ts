import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { templates, templateVariables } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { validateTemplateName } from "@/lib/utils/validation";

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
