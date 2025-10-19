/**
 * Variable Detection Utilities
 *
 * This module provides utilities for detecting merge tag variables in email template HTML.
 * Variables are identified using the {{VARIABLE}} syntax and extracted for metadata management.
 *
 * **Purpose:**
 * - Detect merge tags in template HTML content
 * - Extract unique variable names from email designs
 * - Support real-time variable detection during editing
 * - Enable variable-to-metadata mapping for the SDK
 *
 * **Merge Tag Syntax:**
 * Variables are written in HTML as {{VARIABLE_NAME}} where VARIABLE_NAME:
 * - Must be uppercase letters and underscores only
 * - Examples: {{NAME}}, {{FIRST_NAME}}, {{USER_EMAIL}}, {{INVITATION_CODE}}
 *
 * **Detection Regex:**
 * Pattern: /\{\{([A-Z_]+)\}\}/g
 * - Matches: {{VAR}}, {{MY_VAR}}, {{USER_EMAIL}}, etc.
 * - Does not match: {{var}} (lowercase), {{ VAR}} (spaces), {{var-name}} (hyphens)
 * - Captures the variable name without braces via capture group 1
 *
 * **Usage in Template Editor Flow:**
 * 1. User designs template in visual editor
 * 2. On save or periodically, exportHtml() is called to get production HTML
 * 3. detectVariables() parses HTML to find all {{VAR}} patterns
 * 4. Results shown in VariableManager for user to define metadata
 * 5. Variable metadata saved with template in template_variables table
 *
 * **Performance:**
 * - Regex execution is O(n) where n is HTML length
 * - For typical emails (5-20KB), detection is <10ms
 * - Safe to call frequently for real-time detection
 * - Consider debouncing if calling on every keystroke
 *
 * **Error Handling:**
 * - Empty HTML returns empty array
 * - Malformed HTML is handled gracefully (partial matches valid)
 * - Duplicate variable names returned once in Set-based deduplication
 *
 * **Integration Points:**
 * - Called by VariableManager component during editing
 * - Called by template editor to provide variable suggestions
 * - Called by save handlers to extract variables from template
 *
 * **Related Files:**
 * - components/variable-manager.tsx: Uses detectVariables() for UI display
 * - components/template-editor.tsx: Exposes editor for exportHtml() calls
 * - app/(studio)/templates/new/page.tsx: Calls detectVariables() on save
 * - app/(studio)/templates/[id]/edit/page.tsx: Calls detectVariables() on save
 *
 * @module lib/utils/variable-detection
 * @requires (none - pure utility functions)
 *
 * @example
 * ```typescript
 * import { detectVariables } from '@/lib/utils/variable-detection';
 *
 * const html = '<p>Hello {{NAME}}, your email is {{EMAIL}}</p>';
 * const variables = detectVariables(html);
 * console.log(variables); // ['NAME', 'EMAIL']
 * ```
 *
 * @example
 * ```typescript
 * // Real-time detection in component
 * editorRef.current?.editor?.exportHtml((data) => {
 *   const detectedVars = detectVariables(data.html);
 *   setDetectedVariables(detectedVars);
 * });
 * ```
 */

/**
 * Detects all merge tag variables in HTML content.
 *
 * Scans the provided HTML string for patterns matching {{VARIABLE_NAME}} where
 * VARIABLE_NAME consists of uppercase letters and underscores only.
 *
 * Returns a deduplicated array of variable names found, in order of first appearance.
 * If no variables found, returns empty array.
 *
 * **Regex Pattern:** /\{\{([A-Z_]+)\}\}/g
 * - Matches literal {{ and }} braces
 * - Captures variable name (uppercase letters and underscores)
 * - Ignores lowercase, spaces, or special characters in variable names
 *
 * **Deduplication:**
 * Uses Set to track seen variables, maintains order of first appearance.
 * Example: detectVariables('{{NAME}} and {{NAME}} and {{EMAIL}}') → ['NAME', 'EMAIL']
 *
 * **Edge Cases:**
 * - Empty HTML: Returns []
 * - No variables: Returns []
 * - Malformed braces like {{ NAME }} (spaces): Not matched (returns [])
 * - Lowercase like {{name}}: Not matched (returns [])
 * - Mixed case like {{Name}}: Not matched (returns [])
 *
 * **Performance:**
 * O(n) time complexity where n is HTML string length
 * Typical emails generate <50 variables, execution <10ms
 *
 * **Thread Safety:**
 * Pure function, no side effects, safe to call from multiple contexts
 *
 * @param html - HTML string to scan for merge tags
 * @returns Array of unique variable names in order of first appearance
 *
 * @throws Never throws - handles empty strings and malformed input gracefully
 *
 * @example
 * ```typescript
 * const html = '<p>Hello {{FIRST_NAME}} {{LAST_NAME}},</p>' +
 *              '<p>Your email is {{EMAIL}}</p>' +
 *              '<p>Verification code: {{CODE}}</p>';
 * const vars = detectVariables(html);
 * // Result: ['FIRST_NAME', 'LAST_NAME', 'EMAIL', 'CODE']
 * ```
 *
 * @example
 * ```typescript
 * // With duplicate variables
 * const html = '<p>Hi {{USER_NAME}}</p><p>Dear {{USER_NAME}},</p>';
 * const vars = detectVariables(html);
 * // Result: ['USER_NAME'] - duplicate removed
 * ```
 *
 * @example
 * ```typescript
 * // No variables in HTML
 * const html = '<p>This is plain HTML with no variables</p>';
 * const vars = detectVariables(html);
 * // Result: []
 * ```
 */
export function detectVariables(html: string): string[] {
    if (!html) {
        return [];
    }

    const variablePattern = /\{\{([A-Z_]+)\}\}/g;
    const seen = new Set<string>();
    const variables: string[] = [];

    let match;
    while ((match = variablePattern.exec(html)) !== null) {
        const variableName = match[1];
        if (!seen.has(variableName)) {
            seen.add(variableName);
            variables.push(variableName);
        }
    }

    return variables;
}

/**
 * Gets unique variable names from an array of variable names.
 *
 * This utility removes duplicate variable names while preserving order
 * of first appearance. Useful after combining variable lists from
 * multiple sources.
 *
 * @param variables - Array of variable names (may contain duplicates)
 * @returns Array of unique variable names in order of first appearance
 *
 * @example
 * ```typescript
 * const allVars = ['NAME', 'EMAIL', 'NAME', 'CODE'];
 * const unique = deduplicateVariables(allVars);
 * // Result: ['NAME', 'EMAIL', 'CODE']
 * ```
 */
export function deduplicateVariables(variables: string[]): string[] {
    const seen = new Set<string>();
    return variables.filter(variable => {
        if (seen.has(variable)) {
            return false;
        }
        seen.add(variable);
        return true;
    });
}
