/**
 * Validation utilities for template name sanitization
 * Ensures template names are safe for database storage and SDK usage
 */

const TEMPLATE_NAME_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

/**
 * Validates and sanitizes a template name
 * Requirements:
 * - 1-100 characters
 * - Alphanumeric, hyphens, underscores only
 * - No special characters or spaces
 *
 * @param name - The template name to validate
 * @returns Object with isValid boolean and sanitized name
 */
export function validateTemplateName(
  name: string
): { isValid: boolean; sanitized: string; error?: string } {
  if (!name || typeof name !== "string") {
    return { isValid: false, sanitized: "", error: "Template name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      sanitized: "",
      error: "Template name cannot be empty",
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      sanitized: "",
      error: "Template name cannot exceed 100 characters",
    };
  }

  if (!TEMPLATE_NAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      sanitized: trimmed,
      error:
        "Template name can only contain alphanumeric characters, hyphens, and underscores",
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Sanitizes a template name by removing invalid characters
 * and converting to lowercase
 *
 * @param name - The template name to sanitize
 * @returns Sanitized name (lowercase, no special characters)
 */
export function sanitizeTemplateName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}
