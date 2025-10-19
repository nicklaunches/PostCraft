/**
 * SDK Test Script
 * 
 * This script tests the PostCraft SDK by:
 * 1. Creating a sample template in the database
 * 2. Rendering the template with variable substitution
 * 3. Verifying the output
 * 
 * Run with: npx tsx lib/sdk/test-sdk.ts
 */

// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

import { PostCraft } from "./postcraft";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { templates, templateVariables } from "@/lib/db/schema";

// Create DB connection after env vars are loaded
const connectionString = process.env.POSTCRAFT_DATABASE_URL;
if (!connectionString) {
  throw new Error("POSTCRAFT_DATABASE_URL not set");
}
const client = postgres(connectionString, { max: 10 });
const db = drizzle(client, { schema });

async function testSDK() {
  console.log("🧪 PostCraft SDK Test\n");

  // Step 1: Create a sample template
  console.log("1. Creating sample template...");
  
  try {
    const [template] = await db
      .insert(templates)
      .values({
        name: "test-welcome-email",
        content: {
          // Simplified react-email-editor design JSON
          body: {
            rows: [
              {
                cells: [
                  {
                    contents: [
                      {
                        type: "text",
                        values: {
                          text: "<p>Hello {{NAME}}, welcome to PostCraft!</p><p>You are {{AGE}} years old.</p>",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      })
      .returning()
      .onConflictDoNothing();

    if (template) {
      console.log(`✓ Template created: ${template.name} (ID: ${template.id})`);

      // Step 2: Add template variables metadata
      console.log("\n2. Adding template variables...");
      await db.insert(templateVariables).values([
        {
          templateId: template.id,
          key: "NAME",
          type: "string",
          fallbackValue: "User",
          isRequired: false,
        },
        {
          templateId: template.id,
          key: "AGE",
          type: "number",
          fallbackValue: "25",
          isRequired: false,
        },
      ]);
      console.log("✓ Variables added: NAME (string), AGE (number)");
    } else {
      console.log("✓ Template already exists, using existing template");
    }
  } catch (error) {
    console.error("✗ Error creating template:", error);
  }

  // Step 3: Initialize SDK
  console.log("\n3. Initializing PostCraft SDK...");
  const postcraft = new PostCraft();
  console.log("✓ SDK initialized");

  // Step 4: Test rendering with all variables
  console.log("\n4. Testing render with all variables...");
  try {
    const html1 = await postcraft.templates.render("test-welcome-email", {
      NAME: "Alice",
      AGE: 30,
    });
    console.log("✓ Rendered successfully:");
    console.log(html1.substring(0, 200) + "...\n");
  } catch (error) {
    console.error("✗ Render failed:", error);
  }

  // Step 5: Test rendering with missing optional variables (fallbacks)
  console.log("5. Testing render with fallback values...");
  try {
    const html2 = await postcraft.templates.render("test-welcome-email", {
      NAME: "Bob",
      // AGE not provided, should use fallback
    });
    console.log("✓ Rendered with fallback:");
    console.log(html2.substring(0, 200) + "...\n");
  } catch (error) {
    console.error("✗ Render failed:", error);
  }

  // Step 6: Test error handling - template not found
  console.log("6. Testing error handling (template not found)...");
  try {
    await postcraft.templates.render("nonexistent-template", {});
    console.log("✗ Should have thrown TemplateNotFoundError");
  } catch (error: any) {
    if (error.name === "TemplateNotFoundError") {
      console.log(`✓ Correctly threw ${error.name}: ${error.message}`);
    } else {
      console.error("✗ Unexpected error:", error);
    }
  }

  // Step 7: Test error handling - type mismatch
  console.log("\n7. Testing error handling (type mismatch)...");
  try {
    await postcraft.templates.render("test-welcome-email", {
      NAME: "Charlie",
      AGE: "thirty", // Should be number, not string
    });
    console.log("✗ Should have thrown TemplateVariableTypeError");
  } catch (error: any) {
    if (error.name === "TemplateVariableTypeError") {
      console.log(`✓ Correctly threw ${error.name}: ${error.message}`);
    } else {
      console.error("✗ Unexpected error:", error);
    }
  }

  console.log("\n✅ SDK test complete!");
}

// Run the test
testSDK().catch(console.error);
