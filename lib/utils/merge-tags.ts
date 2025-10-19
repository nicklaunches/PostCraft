/**
 * @fileoverview Merge tag utilities for template variable detection and substitution
 *
 * Provides functions for detecting merge tag placeholders ({{VARIABLE_NAME}}) in
 * HTML/template content and substituting them with actual values. Supports
 * type-aware formatting and fallback values for missing variables.
 *
 * Merge Tag Format: {{VARIABLE_NAME}} (uppercase, uppercase alphanumeric and underscores)
 *
 * Features:
 * - Auto-detect merge tags in HTML content
 * - Type-aware value formatting (string, number, boolean, date)
 * - Fallback value support for missing variables
 * - Required variable validation
 * - Preserves unknown merge tags in output
 *
 * @example
 * // Detect variables in template
 * const html = '<p>Hello {{FIRST_NAME}}, your balance is {{BALANCE}}</p>';
 * const vars = detectMergeTags(html);
 * // Returns: [{ key: 'FIRST_NAME', count: 1 }, { key: 'BALANCE', count: 1 }]
 *
 * @example
 * // Replace variables with values
 * const result = replaceMergeTags(html, { FIRST_NAME: 'John', BALANCE: 100 });
 * // Returns: '<p>Hello John, your balance is 100</p>'
 *
 * @example
 * // Use fallback values
 * const result = replaceMergeTags(html, {}, { FIRST_NAME: 'Customer' });
 * // Returns: '<p>Hello Customer, your balance is {{BALANCE}}</p>'
 */

export interface DetectedVariable {
  key: string;
  count: number; // How many times this variable appears in the template
}

/**
 * Detects all merge tags in HTML content
 * Looks for {{VARIABLE_NAME}} format (uppercase)
 *
 * @param htmlContent - The HTML content to scan for merge tags
 * @returns {DetectedVariable[]} Array of detected variables with their keys and occurrence count
 *
 * @example
 * const vars = detectMergeTags('<p>Hi {{NAME}}, your ID is {{ID}}</p>');
 * // Returns: [{ key: 'NAME', count: 1 }, { key: 'ID', count: 1 }]
 */
export function detectMergeTags(htmlContent: string): DetectedVariable[] {
  const mergeTagRegex = /\{\{([A-Z_]+)\}\}/g;
  const variables = new Map<string, number>();

  let match;
  while ((match = mergeTagRegex.exec(htmlContent)) !== null) {
    const key = match[1];
    variables.set(key, (variables.get(key) || 0) + 1);
  }

  return Array.from(variables.entries()).map(([key, count]) => ({
    key,
    count,
  }));
}

/**
 * Replaces merge tags with provided values
 * Supports fallback values and type-aware formatting
 *
 * @param htmlContent - The HTML content with merge tags
 * @param variables - Map of variable key to replacement value
 * @param fallbacks - Map of variable key to fallback value (defaults to empty object)
 * @returns {string} HTML content with variables replaced
 *
 * @example
 * const result = replaceMergeTags(
 *   '<p>Hi {{NAME}}</p>',
 *   { NAME: 'John' },
 *   { NAME: 'Guest' }
 * );
 * // Returns: '<p>Hi John</p>'
 */
export function replaceMergeTags(
  htmlContent: string,
  variables: Record<string, string | number | boolean>,
  fallbacks: Record<string, string> = {}
): string {
  const mergeTagRegex = /\{\{([A-Z_]+)\}\}/g;

  return htmlContent.replace(mergeTagRegex, (match, key) => {
    // Check if variable is provided
    if (key in variables) {
      return String(variables[key]);
    }

    // Fall back to fallback value if available
    if (key in fallbacks) {
      return fallbacks[key];
    }

    // Return original merge tag if no value found
    return match;
  });
}

/**
 * Validates that required variables are provided
 *
 * @param requiredVariables - Array of required variable keys
 * @param providedVariables - Map of provided variable key to value
 * @returns {{isValid: boolean, missing: string[]}} Validation result with missing variable keys
 *
 * @example
 * const result = validateRequiredVariables(
 *   ['EMAIL', 'NAME'],
 *   { EMAIL: 'user@example.com' }
 * );
 * // Returns: { isValid: false, missing: ['NAME'] }
 */
export function validateRequiredVariables(
  requiredVariables: string[],
  providedVariables: Record<string, string | number | boolean>
): { isValid: boolean; missing: string[] } {
  const missing = requiredVariables.filter((key) => !(key in providedVariables));

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Formats a value according to its type
 * Used for type-aware variable substitution
 *
 * @param value - The value to format
 * @param type - The expected type ('string', 'number', 'boolean', 'date')
 * @returns {string} Formatted value as string
 *
 * @example
 * formatVariableValue(true, 'boolean') // => 'true'
 * formatVariableValue(42, 'number') // => '42'
 * formatVariableValue(new Date('2025-01-01'), 'date') // => '2025-01-01T00:00:00.000Z'
 */
export function formatVariableValue(
  value: unknown,
  type: "string" | "number" | "boolean" | "date"
): string {
  switch (type) {
    case "number":
      return String(Number(value));
    case "boolean":
      return value === true || value === "true" ? "true" : "false";
    case "date":
      if (value instanceof Date) {
        return value.toISOString();
      }
      return String(value);
    case "string":
    default:
      return String(value);
  }
}

