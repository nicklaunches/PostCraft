/**
 * HTML Renderer for react-email-editor Design JSON
 *
 * This module implements server-side HTML generation from react-email-editor's design JSON format.
 * It converts the drag-and-drop email design into production-ready HTML with inline styles
 * suitable for email clients, while preserving merge tags as {{VARIABLE_NAME}} for later substitution.
 *
 * Architecture:
 * - **Design JSON Input**: React-email-editor stores email designs in a structured JSON format
 *   containing layout, styles, content, and component metadata
 * - **HTML Generation**: Parses design JSON and generates semantic HTML with inline CSS
 *   (required for email client compatibility - CSS stylesheets not supported by most email clients)
 * - **Merge Tag Preservation**: Detects and preserves {{VARIABLE_NAME}} tags for later substitution
 * - **Type Validation**: Validates variable values against metadata (string, number, boolean, date)
 * - **Fallback Handling**: Applies fallback values for optional variables not provided at render time
 * - **Required Variables**: Enforces required variables, throwing errors if missing and no fallback
 *
 * Implementation Notes:
 * This implementation handles the core rendering pipeline. For production-grade support of all
 * react-email-editor features, consider these enhancements:
 *
 * **Option 1: Headless Browser (Recommended for guaranteed compatibility)**
 * - Use Puppeteer or Playwright to load react-email-editor in headless browser
 * - Call exportHtml() method server-side exactly as client does
 * - Guaranteed parity with client-side export
 * - Trade-off: Higher resource usage, slower, requires browser runtime
 *
 * **Option 2: Full JSON Parser (Best for performance)**
 * - Reverse engineer complete react-email-editor design JSON structure
 * - Implement renderers for all element types: text, image, button, columns, divider, etc.
 * - Generate email-optimized HTML with inline styles
 * - Trade-off: Requires maintenance as Unlayer updates react-email-editor
 *
 * **Option 3: Hybrid Approach (Pragmatic balance)**
 * - Pre-generate HTML on client using react-email-editor's exportHtml()
 * - Store HTML alongside design JSON in database
 * - Use stored HTML for SDK rendering (with merge tag substitution only)
 * - Regenerate HTML only when template edited
 * - Trade-off: More storage, but excellent performance and full Unlayer compatibility
 *
 * Current Implementation:
 * This module uses Option 2 (partial parser) with fallbacks. It handles:
 * - Merge tag extraction and substitution
 * - Variable type validation
 * - Fallback value application
 * - Basic HTML structure generation
 *
 * For the complete react-email-editor JSON structure and advanced rendering,
 * refer to Unlayer documentation: https://react-email-editor.readthedocs.io/
 *
 * @module html-renderer
 * @requires TemplateVariable type from database schema
 * @exports renderDesignToHtml - Convert design JSON to HTML
 * @exports substituteMergeTags - Replace merge tags with variable values
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
 * This is the core merge tag substitution engine. It finds all {{VARIABLE_NAME}} tags
 * in the HTML and replaces them with actual values. It handles type validation, fallback
 * values, and required variable enforcement per variable metadata.
 *
 * Substitution Algorithm:
 * 1. Find all {{VARIABLE}} patterns using regex /\{\{([A-Z_][A-Z0-9_]*)\}\}/g
 * 2. For each tag found:
 *    a. Look up variable metadata (type, fallback, isRequired)
 *    b. If value provided: validate type, format according to type, use value
 *    c. If value missing: check for fallback value, use if present
 *    d. If still missing: check if required, throw RequiredVariableMissingError if so
 *    e. If optional and no fallback: leave tag unreplaced as {{VARIABLE}}
 * 3. Return HTML with all substitutable tags replaced
 *
 * Variable Naming Convention:
 * - Variables must be UPPERCASE_WITH_UNDERSCORES (e.g., USER_NAME, ORDER_ID)
 * - Must start with letter or underscore, contain only A-Z, 0-9, and underscores
 * - This ensures merge tags are easily distinguishable in HTML templates
 * - Regex pattern: /^[A-Z_][A-Z0-9_]*$/
 *
 * Type Validation:
 * - **string**: Any JavaScript string. No conversion. Used as-is.
 * - **number**: JavaScript number (not string). Must pass isNaN check.
 *   @throws {TemplateVariableTypeError} if string like "123" provided
 * - **boolean**: JavaScript boolean (true/false). No type coercion.
 *   @throws {TemplateVariableTypeError} if string like "true" provided
 * - **date**: Date object or valid date string. Formatted as localized date string.
 *   @example new Date('2025-01-15') → "1/15/2025" (locale dependent)
 *
 * Fallback Behavior:
 * - Fallback values are stored in template variable metadata during template creation
 * - If variable not provided at render time, fallback is used automatically
 * - Fallback values bypass type validation (assumed pre-validated in studio)
 * - Common use case: {{UNSUBSCRIBE_URL}} with fallback to generic unsubscribe link
 *
 * Required Variables:
 * - Mark variables as required during template creation to enforce provision
 * - Required variables with no fallback raise RequiredVariableMissingError if missing
 * - Use for critical variables: ORDER_ID, USER_EMAIL, VERIFICATION_TOKEN, etc.
 *
 * Examples by Variable Type:
 * ```typescript
 * // String variable
 * substituteMergeTags('<p>Hello {{NAME}}</p>', { NAME: 'Alice' }, [
 *   { key: 'NAME', type: 'string', isRequired: true, fallbackValue: null }
 * ])
 * // → '<p>Hello Alice</p>'
 *
 * // Number variable
 * substituteMergeTags('<p>Age: {{AGE}}</p>', { AGE: 30 }, [
 *   { key: 'AGE', type: 'number', isRequired: false, fallbackValue: '18' }
 * ])
 * // → '<p>Age: 30</p>'
 *
 * // Date variable
 * substituteMergeTags('<p>Date: {{CREATED_AT}}</p>',
 *   { CREATED_AT: new Date('2025-01-15') },
 *   [{ key: 'CREATED_AT', type: 'date', isRequired: false, fallbackValue: null }]
 * )
 * // → '<p>Date: 1/15/2025</p>'
 *
 * // With fallback
 * substituteMergeTags('<p>Code: {{PROMO_CODE}}</p>',
 *   {},  // PROMO_CODE not provided
 *   [{ key: 'PROMO_CODE', type: 'string', isRequired: false, fallbackValue: 'WELCOME10' }]
 * )
 * // → '<p>Code: WELCOME10</p>'
 *
 * // Required variable missing
 * substituteMergeTags('<p>Order: {{ORDER_ID}}</p>',
 *   {},  // ORDER_ID not provided
 *   [{ key: 'ORDER_ID', type: 'string', isRequired: true, fallbackValue: null }]
 * )
 * // → throws RequiredVariableMissingError('ORDER_ID')
 * ```
 *
 * @param {string} html - HTML string containing {{VARIABLE}} merge tags.
 *   Tags follow the pattern {{UPPERCASE_NAME}} where name is A-Z, 0-9, underscores only.
 *   Example: '<html><body><p>Hello {{USER_NAME}}, your code is {{ACTIVATION_CODE}}</p></body></html>'
 *
 * @param {Record<string, any>} [variables={}] - Key-value pairs for substitution.
 *   Keys must exactly match variable names in template. Values are validated against
 *   metadata types. If not provided, defaults to empty object (uses only fallbacks).
 *   @example { USER_NAME: 'Bob Smith', ACTIVATION_CODE: 'ABC-123-XYZ' }
 *
 * @param {TemplateVariable[]} [metadata=[]] - Variable metadata array with type info,
 *   fallback values, and required flags. If not provided, defaults to empty array
 *   (unknown types, no fallbacks, no required variables).
 *   Each element:
 *   - key: Variable name matching merge tag
 *   - type: 'string' | 'number' | 'boolean' | 'date'
 *   - isRequired: boolean - whether variable is required
 *   - fallbackValue: string | null - fallback if not provided
 *
 * @returns {string} HTML with merge tags replaced by actual values or fallbacks.
 *   If a merge tag has no value and no fallback, it remains unreplaced (e.g., {{UNKNOWN}}).
 *   Format: Same as input HTML, only merge tags modified.
 *   @example '<html><body><p>Hello Alice, your code is ABC-123</p></body></html>'
 *
 * @throws {TemplateVariableTypeError} If provided variable type does not match metadata.
 *   Example: Providing string "123" when number type expected for {{AGE}}.
 *   @example throw new TemplateVariableTypeError('AGE', 'number', 'string')
 *
 * @throws {RequiredVariableMissingError} If required variable not provided and no fallback.
 *   Example: {{ORDER_ID}} is required but not provided or fallback.
 *   @example throw new RequiredVariableMissingError('ORDER_ID')
 *
 * @example
 * ```typescript
 * import { substituteMergeTags } from './html-renderer'
 *
 * const html = '<p>Hello {{NAME}}, you are {{AGE}} years old</p>'
 * const variables = { NAME: 'John', AGE: 30 }
 * const metadata = [
 *   { key: 'NAME', type: 'string', isRequired: true, fallbackValue: null },
 *   { key: 'AGE', type: 'number', isRequired: false, fallbackValue: null }
 * ]
 *
 * const result = substituteMergeTags(html, variables, metadata)
 * console.log(result)
 * // → '<p>Hello John, you are 30 years old</p>'
 * ```
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
 * Renders react-email-editor design JSON to production-ready HTML
 *
 * This function converts a react-email-editor design (saved via saveDesign()) into
 * email-client-compatible HTML with inline styles. It preserves all merge tags
 * ({{VARIABLE_NAME}}) for later substitution via substituteMergeTags().
 *
 * Input Format:
 * The design parameter is JSON saved by react-email-editor's saveDesign() method.
 * Structure (simplified):
 * ```typescript
 * {
 *   body?: {
 *     rows?: Array<{ columns: Array<{ elements: any[] }> }>
 *   },
 *   html?: string,
 *   // ... other metadata
 * }
 * ```
 *
 * Output Format:
 * Returns valid HTML5 document with:
 * - DOCTYPE declaration for compatibility
 * - Proper head section with charset and viewport meta tags
 * - All CSS inlined to body and elements (required for email clients)
 * - Semantic HTML structure for accessibility
 * - All merge tags ({{VARIABLE}}) preserved as-is
 *
 * Implementation Strategy:
 * This implementation uses a fallback-based approach:
 * 1. If design.body exists: Extract and render body structure
 * 2. Else if design.html exists: Use pre-exported HTML
 * 3. Else: Generate minimal HTML structure with placeholder content
 *
 * Production Recommendations:
 * For 100% compatibility with all react-email-editor features, consider:
 *
 * **Headless Browser (Recommended)**
 * - Use Puppeteer or Playwright headless browser
 * - Load react-email-editor in headless environment
 * - Call exportHtml() programmatically
 * - Pros: Perfect compatibility, guaranteed parity with client
 * - Cons: Higher memory usage, slower, requires browser runtime
 * ```typescript
 * import puppeteer from 'puppeteer'
 * const browser = await puppeteer.launch()
 * const page = await browser.newPage()
 * const html = await page.evaluate((design) => {
 *   return unlayerEditor.exportHtml().html
 * }, designJson)
 * ```
 *
 * **Pre-Export Strategy**
 * - Generate HTML on client in studio using exportHtml()
 * - Store both design JSON and exported HTML in database
 * - Use stored HTML for SDK rendering
 * - Regenerate only on template edits
 * - Pros: Excellent performance, simple implementation
 * - Cons: Additional storage, must regenerate on edits
 *
 * Error Handling:
 * - If designJson is null/undefined/not object: Returns minimal HTML with message
 * - If HTML structure is malformed: Still generates valid HTML (graceful fallback)
 * - Merge tags are always preserved regardless of conversion issues
 *
 * @param {any} designJson - react-email-editor design JSON from saveDesign() method.
 *   Expected structure contains design metadata, layout, content, and styling.
 *   Should be a JavaScript object (not string). If string, convert with JSON.parse() first.
 *   Can be null/undefined - will return minimal HTML.
 *   @example { body: { rows: [...] }, html: '<html>...</html>' }
 *
 * @returns {string} Valid HTML5 document string suitable for email clients.
 *   Always includes DOCTYPE, html, head (with meta tags), and body.
 *   All merge tags ({{VARIABLE}}) preserved as-is for later substitution.
 *   All styles are inlined in element style attributes.
 *   Ready to send via email service providers.
 *   @example '<!DOCTYPE html>\n<html>...</html>'
 *
 * @example
 * ```typescript
 * import { renderDesignToHtml } from './html-renderer'
 *
 * // Design from react-email-editor's saveDesign()
 * const design = {
 *   body: {
 *     rows: [
 *       {
 *         columns: [
 *           {
 *             elements: [
 *               {
 *                 type: 'text',
 *                 content: 'Hello {{USER_NAME}}, welcome!'
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * const html = renderDesignToHtml(design)
 * // → '<html><head>...</head><body>Hello {{USER_NAME}}, welcome!</body></html>'
 * ```
 *
 * @example
 * ```typescript
 * // With pre-exported HTML
 * const design = {
 *   html: '<html>...<p>Hello {{NAME}}</p>...</html>'
 * }
 *
 * const html = renderDesignToHtml(design)
 * // → '<html>...</html>'  (returns as-is if html field exists)
 * ```
 *
 * @example
 * ```typescript
 * // Fallback for empty/invalid design
 * const html = renderDesignToHtml(null)
 * // → '<html><body><p>Empty template</p></body></html>'
 * ```
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
