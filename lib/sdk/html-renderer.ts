/**
 * HTML Renderer for react-email-editor design JSON
 *
 * This module implements server-side HTML generation from react-email-editor's design JSON format.
 * It converts the drag-and-drop email design into production-ready HTML with inline styles
 * suitable for email clients, while preserving merge tags as {{VARIABLE_NAME}}.
 *
 * Note: This is a simplified implementation. For production use, consider:
 * - Using a headless browser (Puppeteer/Playwright) for guaranteed parity with client-side exportHtml()
 * - Full parsing of all react-email-editor design elements and properties
 * - Advanced CSS inline processing for email client compatibility
 */

import type { TemplateVariable } from "@/lib/db/schema";
import {
  TemplateVariableTypeError,
  RequiredVariableMissingError,
} from "./errors";

/**
 * Validates that a provided variable value matches the expected type
 */
function validateVariableType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      // Accept Date objects or valid date strings
      if (value instanceof Date) return !isNaN(value.getTime());
      const parsed = new Date(value);
      return !isNaN(parsed.getTime());
    default:
      return false;
  }
}

/**
 * Formats a variable value according to its type
 */
function formatVariableValue(value: any, type: string): string {
  switch (type) {
    case "number":
      return String(value);
    case "boolean":
      return String(value);
    case "date":
      const date = value instanceof Date ? value : new Date(value);
      return date.toLocaleDateString();
    case "string":
    default:
      return String(value);
  }
}

/**
 * Substitutes merge tags in HTML with provided variable values
 *
 * @param html - HTML string containing {{VARIABLE}} merge tags
 * @param variables - Key-value pairs for variable substitution
 * @param metadata - Variable metadata with types, fallbacks, and required flags
 * @returns HTML with merge tags replaced by actual values
 *
 * @throws {TemplateVariableTypeError} If variable type doesn't match metadata
 * @throws {RequiredVariableMissingError} If required variable is missing without fallback
 */
export function substituteMergeTags(
  html: string,
  variables: Record<string, any> = {},
  metadata: TemplateVariable[] = []
): string {
  return html.replace(/\{\{([A-Z_][A-Z0-9_]*)\}\}/g, (match, key) => {
    const meta = metadata.find((m) => m.key === key);

    // If variable is provided, validate and use it
    if (variables[key] !== undefined && variables[key] !== null) {
      // Validate type if metadata exists
      if (meta && !validateVariableType(variables[key], meta.type)) {
        throw new TemplateVariableTypeError(
          key,
          meta.type,
          typeof variables[key]
        );
      }

      // Format and return the value
      return formatVariableValue(
        variables[key],
        meta?.type || "string"
      );
    }

    // Variable not provided - check for fallback
    if (meta?.fallbackValue !== null && meta?.fallbackValue !== undefined) {
      return meta.fallbackValue;
    }

    // No value and no fallback - check if required
    if (meta?.isRequired) {
      throw new RequiredVariableMissingError(key);
    }

    // Optional variable with no value and no fallback - leave unreplaced
    return match;
  });
}

/**
 * Renders react-email-editor design JSON to HTML
 *
 * This is a simplified implementation that extracts HTML from the design JSON structure.
 * In production, you may want to use a headless browser to run react-email-editor's
 * exportHtml() method for guaranteed compatibility.
 *
 * @param designJson - Design JSON from react-email-editor's saveDesign()
 * @returns HTML string with inline styles
 */
export function renderDesignToHtml(designJson: any): string {
  // react-email-editor stores design in a structured JSON format
  // This is a simplified implementation - actual structure may vary

  if (!designJson || typeof designJson !== 'object') {
    return '<html><body><p>Empty template</p></body></html>';
  }

  // TODO: Implement full design JSON parsing
  // For now, we'll handle the basic structure
  // In production, consider using Puppeteer/Playwright to run exportHtml() server-side

  // Simplified fallback: Extract text content if available
  const bodyContent = extractBodyContent(designJson);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  ${bodyContent}
</body>
</html>`;
}

/**
 * Extracts body content from design JSON
 * This is a placeholder implementation that should be expanded based on
 * actual react-email-editor JSON structure
 */
function extractBodyContent(designJson: any): string {
  // react-email-editor typically stores the design in a 'body' or 'rows' structure
  // This needs to be reverse-engineered from actual design JSON samples

  if (designJson.body) {
    return `<div>${JSON.stringify(designJson.body)}</div>`;
  }

  if (designJson.html) {
    return designJson.html;
  }

  // Fallback: basic content
  return '<div style="padding: 20px;"><p>Template content will appear here</p></div>';
}

/**
 * IMPORTANT NOTE FOR PRODUCTION:
 *
 * This is a simplified implementation of server-side HTML rendering.
 * For production use, consider one of these approaches:
 *
 * 1. Headless Browser (Recommended):
 *    - Use Puppeteer or Playwright to load react-email-editor in a headless browser
 *    - Call exportHtml() method just like in the browser
 *    - Guaranteed parity with client-side export
 *    - Higher resource usage but 100% compatible
 *
 * 2. Full Design JSON Parser:
 *    - Reverse engineer react-email-editor's complete design JSON structure
 *    - Implement renderer for all element types (text, image, button, columns, etc.)
 *    - Generate email-compatible HTML with inline CSS
 *    - Lower resource usage but requires maintenance for Unlayer updates
 *
 * 3. Hybrid Approach:
 *    - Pre-generate HTML in the studio UI using exportHtml()
 *    - Store HTML alongside design JSON in database
 *    - Use stored HTML for SDK rendering (with merge tag substitution)
 *    - Regenerate HTML only when template is edited
 */
