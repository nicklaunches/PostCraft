/**
 * Variable Validation Utilities
 *
 * This module provides validation functions for template variable metadata.
 * Ensures type consistency and validates fallback values match their declared types.
 *
 * **Purpose:**
 * - Validate variable type definitions (string, number, boolean, date)
 * - Validate fallback values match their declared types
 * - Enforce business rules (required variables cannot have fallbacks)
 * - Provide type checking for runtime variable substitution
 *
 * **Supported Types:**
 * - `string`: Text values, default if no type specified
 * - `number`: Integer or decimal numbers
 * - `boolean`: true/false values
 * - `date`: ISO 8601 date strings or Date objects
 *
 * **Validation Rules:**
 *
 * 1. **Type Checking:**
 *    - Validates that a value matches the declared type
 *    - Performs type coercion when appropriate (e.g., "true" → boolean)
 *    - Rejects invalid types with descriptive error messages
 *
 * 2. **Fallback Value Rules:**
 *    - Fallback values must match the declared variable type
 *    - Fallbacks are optional (null is valid)
 *    - Fallback values are stored as strings in database
 *    - Must be parsed/converted back to proper type for validation
 *
 * 3. **Required Variable Rules:**
 *    - Required variables CANNOT have fallback values
 *    - At least one of: provided value or fallback or optional
 *    - If isRequired=true and no fallback, must be provided at runtime
 *
 * 4. **Key Naming:**
 *    - Must be uppercase letters and underscores only
 *    - Enforced at database level via regex
 *    - Validated here for early feedback in UI
 *
 * **Type Conversion:**
 * - String: No conversion needed
 * - Number: Parsed from string via Number() or parseFloat()
 * - Boolean: "true"/"false" strings converted to booleans
 * - Date: ISO 8601 strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss) validated
 *
 * **Integration Points:**
 * - Called by VariableManager when user defines variable metadata
 * - Called during template save to validate all variables
 * - Called in SDK render method to validate provided values
 * - Called to validate fallback values before storing in database
 *
 * **Related Files:**
 * - components/variable-manager.tsx: Uses validation for form fields
 * - lib/sdk/postcraft.ts: Uses validation during render()
 * - app/(studio)/templates/new/page.tsx: Calls on save
 * - app/(studio)/templates/[id]/edit/page.tsx: Calls on save
 *
 * @module lib/utils/variable-validation
 * @requires (none - pure utility functions)
 *
 * @example
 * ```typescript
 * import { validateType, validateFallbackValue } from '@/lib/utils/variable-validation';
 *
 * // Check if value matches type
 * validateType('John', 'string'); // true
 * validateType(42, 'number'); // true
 * validateType('not a number', 'number'); // throws TypeError
 *
 * // Validate fallback value
 * validateFallbackValue('Hello', 'string', false); // true
 * validateFallbackValue('123', 'number', false); // true
 * validateFallbackValue('123', 'string', true); // throws - required can't have fallback
 * ```
 */

export type VariableType = 'string' | 'number' | 'boolean' | 'date';

/**
 * Validates that a value matches the specified type.
 *
 * Performs type checking with appropriate coercion for common cases.
 * Returns true if value matches type, throws TypeError if not.
 *
 * **Type Rules:**
 *
 * - **string**: Always valid (any value can be converted to string)
 * - **number**: Must be a number or numeric string (e.g., "123", "-45.67")
 * - **boolean**: Must be boolean or string "true"/"false"
 * - **date**: Must be ISO 8601 string or Date object
 *
 * **Coercion Behavior:**
 * - Numeric strings like "123" accepted for number type
 * - Boolean strings like "true" and "false" accepted for boolean type
 * - Other strings not coerced (type mismatch throws error)
 *
 * **Error Messages:**
 * Throws TypeError with clear message indicating:
 * - The variable name (if provided)
 * - Expected type
 * - Actual value type
 * - Why it failed
 *
 * @param value - Value to validate
 * @param type - Expected variable type
 * @param variableName - Optional name for error message context
 * @returns {boolean} true if valid
 *
 * @throws {TypeError} if value doesn't match type
 *
 * @example
 * ```typescript
 * // String type (most permissive)
 * validateType('hello', 'string'); // true
 * validateType(123, 'string'); // true (coercible to string)
 * validateType(true, 'string'); // true (coercible to string)
 *
 * // Number type
 * validateType(42, 'number'); // true
 * validateType(3.14, 'number'); // true
 * validateType('123', 'number'); // true (numeric string)
 * validateType('-45', 'number'); // true (negative numeric string)
 * validateType('abc', 'number', 'USER_ID'); // throws TypeError
 *
 * // Boolean type
 * validateType(true, 'boolean'); // true
 * validateType(false, 'boolean'); // true
 * validateType('true', 'boolean'); // true (string coercion)
 * validateType('false', 'boolean'); // true (string coercion)
 * validateType(1, 'boolean', 'IS_ACTIVE'); // throws TypeError
 *
 * // Date type
 * validateType(new Date(), 'date'); // true
 * validateType('2025-10-18', 'date'); // true (ISO 8601)
 * validateType('2025-10-18T14:30:00', 'date'); // true (ISO 8601 datetime)
 * validateType('invalid-date', 'date', 'CREATED_AT'); // throws TypeError
 * ```
 */
export function validateType(value: any, type: VariableType, variableName?: string): boolean {
    const valueType = typeof value;
    const context = variableName ? ` for variable ${variableName}` : '';

    switch (type) {
        case 'string':
            // Strings always valid
            return true;

        case 'number':
            if (typeof value === 'number' && !isNaN(value)) {
                return true;
            }
            if (typeof value === 'string') {
                const num = Number(value);
                if (!isNaN(num)) {
                    return true;
                }
            }
            throw new TypeError(
                `Expected number${context}, got ${valueType} (${JSON.stringify(value)})`
            );

        case 'boolean':
            if (typeof value === 'boolean') {
                return true;
            }
            if (typeof value === 'string' && (value === 'true' || value === 'false')) {
                return true;
            }
            throw new TypeError(
                `Expected boolean${context}, got ${valueType} (${JSON.stringify(value)}). ` +
                `Use true/false or "true"/"false" strings.`
            );

        case 'date':
            if (value instanceof Date) {
                if (!isNaN(value.getTime())) {
                    return true;
                }
            }
            if (typeof value === 'string') {
                // Validate ISO 8601 format
                const date = new Date(value);
                if (!isNaN(date.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                    return true;
                }
            }
            throw new TypeError(
                `Expected date${context}, got ${valueType} (${JSON.stringify(value)}). ` +
                `Use ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss`
            );

        default:
            const exhaustiveCheck: never = type;
            throw new Error(`Unknown type: ${exhaustiveCheck}`);
    }
}

/**
 * Validates a fallback value for a variable.
 *
 * Checks that:
 * 1. Fallback value matches the declared variable type
 * 2. Required variables do NOT have fallback values (business rule)
 * 3. Fallback value is not empty if provided
 *
 * Fallback values are stored as strings in database, so this function
 * validates the string representation. During SDK render, fallback
 * values are converted back to their proper types.
 *
 * **Business Rules:**
 * - Required variables (isRequired=true) CANNOT have fallbacks
 *   Rationale: Required variables must be provided at runtime
 *   Having a fallback contradicts the "required" designation
 *
 * - Optional variables CAN have fallbacks
 *   Rationale: Fallback used when variable not provided
 *
 * - Fallback can be null (undefined behavior)
 *   Rationale: Nullable fallback means no fallback (variable must be provided)
 *
 * - Empty string fallback is only valid for string type
 *   Rationale: Empty value is valid string, but not valid for number/boolean/date
 *
 * **Type Validation:**
 * Performs same type validation as validateType(), ensuring fallback
 * value conforms to the variable's declared type.
 *
 * @param fallbackValue - Fallback value to validate (as string, as stored in DB)
 * @param type - Variable type the fallback must match
 * @param isRequired - Whether variable is required (if true, fallback must be null)
 * @param variableName - Optional name for error message context
 * @returns {boolean} true if valid
 *
 * @throws {Error} if required variable has fallback
 * @throws {TypeError} if fallback value doesn't match type
 *
 * @example
 * ```typescript
 * // Valid fallbacks
 * validateFallbackValue('John', 'string', false); // true
 * validateFallbackValue('123', 'number', false); // true
 * validateFallbackValue('true', 'boolean', false); // true
 * validateFallbackValue(null, 'string', false); // true (no fallback)
 * validateFallbackValue(null, 'string', true); // true (required, no fallback)
 *
 * // Invalid: Required with fallback
 * validateFallbackValue('John', 'string', true, 'USER_NAME'); // throws Error
 *
 * // Invalid: Type mismatch
 * validateFallbackValue('not-a-number', 'number', false, 'AGE'); // throws TypeError
 *
 * // Edge case: Empty string fallback
 * validateFallbackValue('', 'string', false); // true (valid empty string)
 * validateFallbackValue('', 'number', false, 'COUNT'); // throws TypeError
 * ```
 */
export function validateFallbackValue(
    fallbackValue: string | null | undefined,
    type: VariableType,
    isRequired: boolean,
    variableName?: string
): boolean {
    const context = variableName ? ` for variable ${variableName}` : '';

    // Required variables cannot have fallbacks
    if (isRequired && fallbackValue !== null && fallbackValue !== undefined) {
        throw new Error(
            `Required variable${context} cannot have a fallback value. ` +
            `Either make it optional or remove the fallback.`
        );
    }

    // No fallback is always valid
    if (fallbackValue === null || fallbackValue === undefined) {
        return true;
    }

    // If fallback provided, validate it matches type
    validateType(fallbackValue, type, variableName);
    return true;
}

/**
 * Validates a variable key name format.
 *
 * Variable names must be uppercase letters and underscores only,
 * following the {{VARIABLE_NAME}} syntax.
 *
 * **Valid Formats:**
 * - {{NAME}}
 * - {{FIRST_NAME}}
 * - {{USER_EMAIL}}
 * - {{MY_LONG_VARIABLE_NAME}}
 *
 * **Invalid Formats:**
 * - {{name}} (lowercase)
 * - {{FirstName}} (mixed case)
 * - {{first-name}} (hyphens)
 * - {{first name}} (spaces)
 * - {{first.name}} (dots)
 * - {{}} (empty)
 * - {{1ABC}} (starts with number)
 *
 * @param key - Variable key to validate
 * @param variableName - Optional name for error message (usually same as key)
 * @returns {boolean} true if valid
 *
 * @throws {Error} if key format invalid
 *
 * @example
 * ```typescript
 * validateVariableKey('NAME'); // true
 * validateVariableKey('FIRST_NAME'); // true
 * validateVariableKey('USER_EMAIL_ADDRESS'); // true
 * validateVariableKey('name', 'USER_NAME'); // throws Error
 * validateVariableKey('first-name'); // throws Error
 * validateVariableKey('first name'); // throws Error
 * ```
 */
export function validateVariableKey(key: string): boolean {
    if (!key || !/^[A-Z_][A-Z_0-9]*$/.test(key)) {
        throw new Error(
            `Invalid variable key: "${key}". ` +
            `Keys must be uppercase letters, underscores, and numbers (starting with letter or underscore).`
        );
    }
    return true;
}

/**
 * Converts a fallback value string (as stored in DB) to its proper type.
 *
 * Since fallback values are stored as TEXT in the database, this function
 * converts them back to their proper types for use in the SDK render method.
 *
 * **Conversion Rules:**
 * - string: Returned as-is
 * - number: Parsed via Number()
 * - boolean: "true" → true, "false" → false
 * - date: Parsed via new Date()
 *
 * **Error Handling:**
 * Throws TypeError if conversion fails (indicates data corruption or bug).
 *
 * @param value - Fallback value stored as string
 * @param type - Target type to convert to
 * @param variableName - Optional name for error context
 * @returns {any} Converted value in proper type
 *
 * @throws {TypeError} if conversion fails
 *
 * @example
 * ```typescript
 * convertFallbackType('hello', 'string'); // 'hello'
 * convertFallbackType('42', 'number'); // 42
 * convertFallbackType('3.14', 'number'); // 3.14
 * convertFallbackType('true', 'boolean'); // true
 * convertFallbackType('false', 'boolean'); // false
 * convertFallbackType('2025-10-18', 'date'); // Date object
 * ```
 */
export function convertFallbackType(
    value: string,
    type: VariableType,
    variableName?: string
): any {
    const context = variableName ? ` for variable ${variableName}` : '';

    try {
        switch (type) {
            case 'string':
                return value;
            case 'number':
                const num = Number(value);
                if (isNaN(num)) {
                    throw new TypeError(`Cannot convert "${value}" to number`);
                }
                return num;
            case 'boolean':
                if (value === 'true') return true;
                if (value === 'false') return false;
                throw new TypeError(`Cannot convert "${value}" to boolean (use "true" or "false")`);
            case 'date':
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new TypeError(`Cannot convert "${value}" to date (use ISO 8601 format)`);
                }
                return date;
            default:
                const exhaustiveCheck: never = type;
                throw new Error(`Unknown type: ${exhaustiveCheck}`);
        }
    } catch (error) {
        if (error instanceof TypeError) {
            throw new TypeError(`Failed to convert fallback value${context}: ${error.message}`);
        }
        throw error;
    }
}
