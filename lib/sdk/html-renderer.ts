/**
 * HTML Renderer for Email Templates
 *
 * This module handles merge tag substitution for email templates. HTML is always pre-exported
 * from react-email-editor in the PostCraft studio and stored in the database. This module
 * focuses solely on replacing {{VARIABLE_NAME}} merge tags with actual values.
 *
 * Architecture:
 * - **HTML Input**: Pre-exported HTML from react-email-editor's exportHtml() method
 * - **Merge Tag Substitution**: Replaces {{VARIABLE_NAME}} tags with provided values
 * - **Type Validation**: Validates variable values against metadata (string, number, boolean, date)
 * - **Fallback Handling**: Applies fallback values for optional variables not provided at render time
 * - **Required Variables**: Enforces required variables, throwing errors if missing and no fallback
 *
 * @module html-renderer
 * @requires TemplateVariable type from database schema
 * @exports substituteMergeTags - Replace merge tags with variable values
 */

import type { TemplateVariable } from "@/lib/db/schema";
import { TemplateVariableTypeError, RequiredVariableMissingError } from "./errors";

/**
 * Validates that a provided variable value matches the expected type
 *
 * Performs type checking for template variables against their declared metadata types.
 * Supports four type categories: string, number, boolean, and date. Follows strict
 * type validation rules (no implicit type coercion).
 *
 * Type Validation Rules:
 * - **string**: Any JavaScript string is valid
 * - **number**: Must be JavaScript number type, must not be NaN
 * - **boolean**: Must be JavaScript boolean type (true/false), not 1/0
 * - **date**: Must be Date object or valid date string, and represent valid date
 *
 * @internal Used internally by substituteMergeTags for variable validation
 *
 * @param {any} value - The value to validate. Can be any JavaScript type.
 * @param {string} expectedType - Expected type name: 'string', 'number', 'boolean', or 'date'
 *
 * @returns {boolean} True if value matches expected type, false if type mismatch.
 *   Returns false for unknown/unsupported types.
 *
 * @example
 * ```typescript
 * validateVariableType('hello', 'string')    // → true
 * validateVariableType(30, 'number')         // → true (valid number)
 * validateVariableType('30', 'number')       // → false (string, not number)
 * validateVariableType(NaN, 'number')        // → false (NaN is invalid)
 * validateVariableType(true, 'boolean')      // → true
 * validateVariableType('true', 'boolean')    // → false (string, not boolean)
 * validateVariableType(new Date(), 'date')   // → true
 * validateVariableType('2025-01-15', 'date') // → true (valid date string)
 * ```
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
 * Formats a variable value to string according to its type
 *
 * Converts typed values to their string representation for HTML merge tag substitution.
 * Different types require different formatting to maintain semantic meaning in HTML:
 * - Numbers: Convert directly to string
 * - Booleans: Convert to string ('true'/'false')
 * - Dates: Format as localized date string for readability
 * - Strings: Pass through as-is
 *
 * This function is called after type validation, so input is guaranteed to match type.
 *
 * @internal Used internally by substituteMergeTags after type validation
 *
 * @param {any} value - The value to format. Should be valid for given type.
 * @param {string} type - Type of the value: 'string', 'number', 'boolean', or 'date'.
 *   Defaults to 'string' for unknown types.
 *
 * @returns {string} String representation of value suitable for HTML substitution.
 *   Format depends on type:
 *   - number: "123" (standard string representation)
 *   - boolean: "true" or "false"
 *   - date: Localized date like "1/15/2025" (varies by browser locale)
 *   - string: Original string unchanged
 *
 * @example
 * ```typescript
 * formatVariableValue(123, 'number')                    // → "123"
 * formatVariableValue(true, 'boolean')                  // → "true"
 * formatVariableValue(false, 'boolean')                 // → "false"
 * formatVariableValue(new Date('2025-01-15'), 'date')   // → "1/15/2025" (US locale)
 * formatVariableValue('hello', 'string')                // → "hello"
 * formatVariableValue('value', 'unknown')               // → "value" (defaults to string)
 * ```
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
 *
 * @throws {TemplateVariableTypeError} If provided variable type does not match metadata.
 *   Example: Providing string "123" when number type expected for {{AGE}}.
 *
 * @throws {RequiredVariableMissingError} If required variable not provided and no fallback.
 *   Example: {{ORDER_ID}} is required but not provided or fallback.
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
    metadata: TemplateVariable[] = [],
): string {
    return html.replace(/\{\{([A-Z_][A-Z0-9_]*)\}\}/g, (match, key) => {
        const meta = metadata.find((m) => m.key === key);

        // If variable is provided, validate and use it
        if (variables[key] !== undefined && variables[key] !== null) {
            // Validate type if metadata exists
            if (meta && !validateVariableType(variables[key], meta.type)) {
                throw new TemplateVariableTypeError(key, meta.type, typeof variables[key]);
            }

            // Format and return the value
            return formatVariableValue(variables[key], meta?.type || "string");
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
