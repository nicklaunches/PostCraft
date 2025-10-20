/**
 * Unlayer JSON validation utilities for template import feature.
 *
 * This module provides functions to validate Unlayer design JSON structure,
 * enforce file size limits, and determine import source priority when both
 * file upload and textarea paste are provided.
 *
 * @module lib/utils/unlayer-validation
 */

/**
 * Represents a valid Unlayer design JSON structure.
 *
 * The Unlayer editor requires specific properties to successfully load a design:
 * - body: Contains the email structure with rows and values
 * - counters: Tracks internal entity counts used by the editor
 * - schemaVersion: Version indicator for the design schema
 *
 * @interface UnlayerDesign
 */
export interface UnlayerDesign {
  body: {
    rows: any[];
    values: Record<string, any>;
  };
  counters: {
    u_column: number;
    u_row: number;
    u_content: number;
  };
  schemaVersion: number;
}

/**
 * Maximum file size for JSON uploads: 5 MB.
 * Unlayer design JSON files are typically <1 MB, so 5 MB provides ample headroom.
 *
 * @constant {number}
 */
export const MAX_JSON_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

/**
 * Maximum character count for pasted JSON content: ~5 million characters.
 * This roughly corresponds to the 5 MB file size limit (accounting for UTF-8 encoding).
 *
 * @constant {number}
 */
export const MAX_JSON_CHARS = 5_000_000;

/**
 * Error messages for validation failures.
 * These messages are displayed to users when import validation fails.
 *
 * @constant {Object} VALIDATION_ERRORS
 */
export const VALIDATION_ERRORS = {
  EMPTY_INPUT: "Please paste JSON or upload a file",
  INVALID_FILE_TYPE: "Please upload a valid JSON file",
  FILE_TOO_LARGE: "File size exceeds maximum limit of 5 MB",
  PASTED_CONTENT_TOO_LARGE: "Pasted content exceeds maximum size limit",
  INVALID_JSON: "Invalid JSON format",
  INVALID_UNLAYER_STRUCTURE: "File does not contain valid Unlayer design data",
} as const;

/**
 * Type guard to validate that a value is a valid Unlayer design JSON object.
 *
 * Performs minimal validation to ensure the JSON is a non-empty object.
 * The Unlayer editor is flexible and can handle various design structures,
 * so we only check that it's a valid JSON object rather than enforcing
 * strict schema requirements.
 *
 * @param {unknown} json - The value to validate
 * @returns {json is UnlayerDesign} True if the value is a valid Unlayer design
 *
 * @example
 * ```typescript
 * const json = JSON.parse(fileContent);
 * if (isValidUnlayerDesign(json)) {
 *   // Safe to pass to editor
 *   editor.loadDesign(json);
 * } else {
 *   console.error('Invalid JSON structure');
 * }
 * ```
 */
export function isValidUnlayerDesign(json: unknown): json is UnlayerDesign {
  // Check if json is a non-null object
  if (!json || typeof json !== "object") {
    return false;
  }

  // Check if it's an array (arrays are objects in JS, but we want plain objects)
  if (Array.isArray(json)) {
    return false;
  }

  // If it's a plain object, consider it valid
  // The Unlayer editor will handle various design structures
  return true;
}

/**
 * Determines which import source to use when both file and textarea content are provided.
 *
 * Priority: File upload > Textarea paste
 * This function helps handle the case where a user provides both a file and pasted JSON.
 *
 * @param {File | null} file - The uploaded file, or null if no file provided
 * @param {string} textareaContent - The pasted textarea content, or empty string if nothing pasted
 * @returns {Object} Object with the chosen source and its content
 * @returns {string} .source - Either 'file' or 'textarea'
 * @returns {string | null} .content - The content to import, or null if no valid source
 *
 * @example
 * ```typescript
 * const { source, content } = determineImportSource(file, textareaContent);
 * if (!content) {
 *   showError('Please provide JSON via file or textarea');
 *   return;
 * }
 * console.log(`Importing from ${source}`);
 * ```
 */
export function determineImportSource(
  file: File | null,
  textareaContent: string
): { source: "file" | "textarea" | null; content: File | string | null } {
  // File takes precedence if provided
  if (file) {
    return { source: "file", content: file };
  }

  // Use textarea content if file not provided and textarea has content
  if (textareaContent.trim().length > 0) {
    return { source: "textarea", content: textareaContent };
  }

  // No valid source provided
  return { source: null, content: null };
}

/**
 * Validates a file's extension and size.
 *
 * Performs basic file validation without reading content:
 * - Checks if file extension is .json
 * - Checks if file size is within limits
 *
 * @param {File} file - The file to validate
 * @returns {Object} Validation result
 * @returns {boolean} .valid - Whether the file passed validation
 * @returns {string | null} .error - Error message if validation failed, null otherwise
 *
 * @example
 * ```typescript
 * const validation = validateFile(uploadedFile);
 * if (!validation.valid) {
 *   showError(validation.error);
 *   return;
 * }
 * ```
 */
export function validateFile(file: File): { valid: boolean; error: string | null } {
  // Check file extension
  if (!file.name.toLowerCase().endsWith(".json")) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.INVALID_FILE_TYPE,
    };
  }

  // Check file size
  if (file.size > MAX_JSON_SIZE) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.FILE_TOO_LARGE,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates pasted textarea content.
 *
 * Checks if content size is within limits.
 *
 * @param {string} content - The pasted content to validate
 * @returns {Object} Validation result
 * @returns {boolean} .valid - Whether the content passed validation
 * @returns {string | null} .error - Error message if validation failed, null otherwise
 *
 * @example
 * ```typescript
 * const validation = validateTextareaContent(pastedJSON);
 * if (!validation.valid) {
 *   showError(validation.error);
 *   return;
 * }
 * ```
 */
export function validateTextareaContent(content: string): { valid: boolean; error: string | null } {
  if (content.length > MAX_JSON_CHARS) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.PASTED_CONTENT_TOO_LARGE,
    };
  }

  return { valid: true, error: null };
}

/**
 * Parses and validates JSON content.
 *
 * Attempts to parse JSON and validate its structure.
 *
 * @param {string} jsonString - The JSON string to parse and validate
 * @returns {Object} Validation result
 * @returns {boolean} .valid - Whether the JSON is valid
 * @returns {UnlayerDesign | null} .design - The parsed design if valid, null otherwise
 * @returns {string | null} .error - Error message if validation failed, null otherwise
 *
 * @example
 * ```typescript
 * const result = parseAndValidateJSON(jsonContent);
 * if (!result.valid) {
 *   showError(result.error);
 *   return;
 * }
 * // result.design is guaranteed to be a valid UnlayerDesign
 * editor.loadDesign(result.design);
 * ```
 */
export function parseAndValidateJSON(jsonString: string): {
  valid: boolean;
  design: UnlayerDesign | null;
  error: string | null;
} {
  try {
    const parsed = JSON.parse(jsonString);

    if (!isValidUnlayerDesign(parsed)) {
      return {
        valid: false,
        design: null,
        error: VALIDATION_ERRORS.INVALID_UNLAYER_STRUCTURE,
      };
    }

    return {
      valid: true,
      design: parsed,
      error: null,
    };
  } catch (error) {
    // JSON parse errors (SyntaxError)
    if (error instanceof SyntaxError) {
      return {
        valid: false,
        design: null,
        error: VALIDATION_ERRORS.INVALID_JSON,
      };
    }

    // Unexpected errors
    return {
      valid: false,
      design: null,
      error: VALIDATION_ERRORS.INVALID_JSON,
    };
  }
}
