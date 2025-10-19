/**
 * SDK Contract: PostCraft Class
 *
 * Defines the public API for the PostCraft SDK used by consuming applications
 * to programmatically render email templates.
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface PostCraftConfig {
  /**
   * Optional database URL override. If not provided, falls back to
   * POSTCRAFT_DATABASE_URL environment variable.
   */
  databaseUrl?: string

  /**
   * Optional timeout for database queries in milliseconds.
   * Default: 5000ms
   */
  timeout?: number

  /**
   * Optional cache TTL for template lookups in seconds.
   * Default: 0 (no caching)
   */
  cacheTtl?: number
}

// ============================================================================
// Error Types
// ============================================================================

export class TemplateNotFoundError extends Error {
  constructor(public templateName: string) {
    super(`Template "${templateName}" not found`)
    this.name = 'TemplateNotFoundError'
  }
}

export class TemplateVariableTypeError extends TypeError {
  constructor(
    public variableName: string,
    public expectedType: string,
    public providedType: string
  ) {
    super(
      `Variable "${variableName}" expected type ${expectedType}, got ${providedType}`
    )
    this.name = 'TemplateVariableTypeError'
  }
}

export class RequiredVariableMissingError extends Error {
  constructor(public variableName: string) {
    super(
      `Required variable "${variableName}" is missing and has no fallback`
    )
    this.name = 'RequiredVariableMissingError'
  }
}

export class DatabaseConnectionError extends Error {
  constructor(public details: string) {
    super(`Database connection failed: ${details}`)
    this.name = 'DatabaseConnectionError'
  }
}

// ============================================================================
// PostCraft SDK Class
// ============================================================================

export class PostCraft {
  /**
   * Initialize PostCraft SDK
   *
   * @param config Optional configuration object
   *
   * @throws {DatabaseConnectionError} If database connection cannot be established
   *
   * @example
   * ```typescript
   * import { PostCraft } from 'postcraft'
   *
   * // Use default POSTCRAFT_DATABASE_URL from environment
   * const postcraft = new PostCraft()
   *
   * // Override database URL
   * const postcraft = new PostCraft({
   *   databaseUrl: 'postgresql://user:pass@host/db'
   * })
   * ```
   */
  constructor(config?: PostCraftConfig)

  /**
   * Templates namespace for template-related operations
   */
  templates: {
    /**
     * Render a template with provided variables
     *
     * @param name - Template name (as defined in studio)
     * @param variables - Key-value pairs for merge tag substitution
     * @returns Rendered HTML with variables substituted
     *
     * @throws {TemplateNotFoundError} If template name does not exist
     * @throws {TemplateVariableTypeError} If variable type does not match metadata
     * @throws {RequiredVariableMissingError} If required variable missing with no fallback
     * @throws {DatabaseConnectionError} If database query fails
     *
     * @example
     * ```typescript
     * // Render template with all variables
     * const html = await postcraft.templates.render('welcome-email', {
     *   NAME: 'John Doe',
     *   AGE: 30
     * })
     *
     * // Render with optional variables (fallbacks used)
     * const html = await postcraft.templates.render('welcome-email', {
     *   NAME: 'John Doe'
     *   // AGE not provided, will use fallback value if defined
     * })
     * ```
     */
    render(name: string, variables?: Record<string, any>): Promise<string>
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Basic Usage Example:
 *
 * ```typescript
 * import { PostCraft } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * // Render welcome email
 * const html = await postcraft.templates.render('welcome-email', {
 *   NAME: 'Alice',
 *   AGE: 25
 * })
 *
 * console.log(html) // <html>Hello Alice, you are 25 years old...</html>
 * ```
 *
 * Error Handling Example:
 *
 * ```typescript
 * import {
 *   PostCraft,
 *   TemplateNotFoundError,
 *   TemplateVariableTypeError,
 *   RequiredVariableMissingError
 * } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * try {
 *   const html = await postcraft.templates.render('unknown-template', {})
 * } catch (error) {
 *   if (error instanceof TemplateNotFoundError) {
 *     console.error(`Template ${error.templateName} does not exist`)
 *   } else if (error instanceof TemplateVariableTypeError) {
 *     console.error(
 *       `Variable ${error.variableName}: expected ${error.expectedType}, got ${error.providedType}`
 *     )
 *   } else if (error instanceof RequiredVariableMissingError) {
 *     console.error(`Missing required variable: ${error.variableName}`)
 *   }
 * }
 * ```
 *
 * Type Validation Example:
 *
 * ```typescript
 * // Template has variable AGE with type 'number'
 *
 * // ✅ Correct usage
 * await postcraft.templates.render('user-profile', {
 *   NAME: 'Bob',
 *   AGE: 30  // number type matches
 * })
 *
 * // ❌ Throws TemplateVariableTypeError
 * await postcraft.templates.render('user-profile', {
 *   NAME: 'Bob',
 *   AGE: '30'  // string provided for number type
 * })
 * // Error: Variable "AGE" expected type number, got string
 * ```
 *
 * Required Variables Example:
 *
 * ```typescript
 * // Template has required variable ORDER_ID with no fallback
 *
 * // ✅ Correct usage
 * await postcraft.templates.render('order-confirmation', {
 *   ORDER_ID: '12345'
 * })
 *
 * // ❌ Throws RequiredVariableMissingError
 * await postcraft.templates.render('order-confirmation', {})
 * // Error: Required variable "ORDER_ID" is missing and has no fallback
 * ```
 */
