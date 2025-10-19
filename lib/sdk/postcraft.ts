/**
 * PostCraft SDK - Programmatic Email Template Rendering
 *
 * This module provides a Resend-style API for rendering email templates with variable substitution.
 * Templates are defined visually in the PostCraft local studio (localhost:3579) and can be rendered
 * programmatically via this SDK for use in backend services, transactional email systems, or
 * integration with external platforms.
 *
 * Key Features:
 * - **Type-Safe Variable Substitution**: Variables are validated against type metadata (string, number, boolean, date)
 * - **Fallback Values**: Template variables can have fallback values used when not provided at render time
 * - **Required Variables**: Mark critical variables as required, raising errors if not provided
 * - **Server-Side HTML Generation**: Converts react-email-editor design JSON to production-ready HTML
 * - **Error Handling**: Comprehensive error types for debugging template rendering issues
 *
 * Architecture:
 * - PostCraft SDK communicates with PostgreSQL database storing template metadata
 * - Each template stores: name, design JSON from react-email-editor, and variable metadata
 * - Rendering pipeline: (1) Load template, (2) Generate HTML from design JSON, (3) Substitute merge tags
 * - Merge tags use {{VARIABLE_NAME}} syntax, matching react-email-editor's merge tag format
 *
 * Usage Patterns:
 *
 * **Single-Use Rendering** (typical use case):
 * ```typescript
 * import { PostCraft } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * // Render welcome email for new user
 * const html = await postcraft.templates.render('welcome-email', {
 *   NAME: 'Alice Smith',
 *   VERIFICATION_LINK: 'https://example.com/verify/abc123'
 * })
 *
 * // Send via email service (e.g., SendGrid, Postmark)
 * await emailService.send({
 *   to: 'alice@example.com',
 *   subject: 'Welcome to Our Service',
 *   html
 * })
 * ```
 *
 * **With Fallbacks** (optional variables):
 * ```typescript
 * // Template has DISCOUNT_CODE with fallback "WELCOME10"
 * const html = await postcraft.templates.render('promo-email', {
 *   NAME: 'Bob'
 *   // DISCOUNT_CODE not provided - will use fallback value
 * })
 * ```
 *
 * **Error Handling** (robust implementation):
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
 *   const html = await postcraft.templates.render('order-confirmation', {
 *     ORDER_ID: 'ORD-12345',
 *     ORDER_DATE: new Date('2025-01-15'),
 *     TOTAL_AMOUNT: 99.99
 *   })
 * } catch (error) {
 *   if (error instanceof TemplateNotFoundError) {
 *     console.error(`Template not found: ${error.templateName}`)
 *   } else if (error instanceof TemplateVariableTypeError) {
 *     console.error(`Type mismatch: ${error.variableName} should be ${error.expectedType}`)
 *   } else if (error instanceof RequiredVariableMissingError) {
 *     console.error(`Required variable missing: ${error.variableName}`)
 *   }
 * }
 * ```
 *
 * Configuration:
 * - Database URL from POSTCRAFT_DATABASE_URL environment variable or config option
 * - Connection pooling with max 10 concurrent connections
 * - Query timeout default 5000ms, configurable via config.timeout
 * - Optional template caching with TTL (default 0 - no caching)
 *
 * @module postcraft
 * @requires drizzle-orm - ORM for type-safe database queries
 * @requires postgres - PostgreSQL client library
 *
 * @exports PostCraft - Main SDK class for template rendering
 * @exports PostCraftConfig - Configuration interface
 * @exports {TemplateNotFoundError} Error class for missing templates
 * @exports {TemplateVariableTypeError} Error class for type validation failures
 * @exports {RequiredVariableMissingError} Error class for missing required variables
 * @exports {DatabaseConnectionError} Error class for database connection issues
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { templates } from "@/lib/db/schema";
import {
  TemplateNotFoundError,
  DatabaseConnectionError,
  TemplateVariableTypeError,
  RequiredVariableMissingError,
} from "./errors";
import { renderDesignToHtml, substituteMergeTags } from "./html-renderer";

/**
 * Configuration options for the PostCraft SDK
 *
 * Customize SDK behavior including database connection, query timeouts, and caching.
 * All options are optional and have sensible defaults for typical use cases.
 *
 * @interface PostCraftConfig
 *
 * @property {string} [databaseUrl] - PostgreSQL connection URL. If not provided, falls back to
 *   POSTCRAFT_DATABASE_URL environment variable. Required at SDK initialization - one of these
 *   must be configured. Format: 'postgresql://user:password@host:port/database'
 *   @example "postgresql://user:pass@localhost:5432/postcraft"
 *
 * @property {number} [timeout] - Query timeout in milliseconds (default: 5000). Controls how long
 *   the SDK waits for database queries before timing out. Useful for slow networks or large databases.
 *   @example 10000 // 10 second timeout
 *
 * @property {number} [cacheTtl] - Cache time-to-live in seconds (default: 0 = no caching).
 *   When > 0, templates are cached in memory for this duration to reduce database queries.
 *   Useful for high-volume rendering but watch for stale data if templates change frequently
 *   in the studio while SDK is running.
 *   @example 300 // Cache templates for 5 minutes
 *
 * @example
 * ```typescript
 * // Minimal config - use environment variable
 * const postcraft = new PostCraft()
 *
 * // Override database URL
 * const postcraft = new PostCraft({
 *   databaseUrl: 'postgresql://user:pass@prod.example.com/email_templates'
 * })
 *
 * // Production config with timeouts and caching
 * const postcraft = new PostCraft({
 *   databaseUrl: 'postgresql://user:pass@prod.example.com/email_templates',
 *   timeout: 10000,        // 10 second timeout for slower networks
 *   cacheTtl: 300          // Cache templates for 5 minutes
 * })
 * ```
 */
export interface PostCraftConfig {
  /**
   * Optional database URL override. If not provided, falls back to
   * POSTCRAFT_DATABASE_URL environment variable.
   */
  databaseUrl?: string;

  /**
   * Optional timeout for database queries in milliseconds.
   * Default: 5000ms
   */
  timeout?: number;

  /**
   * Optional cache TTL for template lookups in seconds.
   * Default: 0 (no caching)
   */
  cacheTtl?: number;
}

/**
 * PostCraft SDK main class
 *
 * Provides programmatic access to email template rendering with variable substitution.
 */
export class PostCraft {
  private db: ReturnType<typeof drizzle<typeof schema>>;
  private config: PostCraftConfig;

  /**
   * Initialize PostCraft SDK
   *
   * Establishes a connection to the PostCraft database and validates configuration.
   * The SDK will maintain a connection pool for efficient database access across
   * multiple render calls.
   *
   * @param {PostCraftConfig} [config] - Optional configuration object. If not provided,
   *   defaults to using POSTCRAFT_DATABASE_URL environment variable.
   *
   * @throws {DatabaseConnectionError} If database connection cannot be established.
   *   Possible causes:
   *   - Missing POSTCRAFT_DATABASE_URL environment variable and no databaseUrl in config
   *   - Invalid PostgreSQL connection URL format
   *   - PostgreSQL server unreachable at specified host/port
   *   - Connection pool exhausted or timeout exceeded
   *
   * @example
   * ```typescript
   * import { PostCraft, DatabaseConnectionError } from 'postcraft'
   *
   * // Use default POSTCRAFT_DATABASE_URL from environment
   * try {
   *   const postcraft = new PostCraft()
   * } catch (error) {
   *   if (error instanceof DatabaseConnectionError) {
   *     console.error('Failed to connect to database:', error.details)
   *     process.exit(1)
   *   }
   * }
   *
   * // Override database URL for testing
   * const postcraft = new PostCraft({
   *   databaseUrl: 'postgresql://test:test@localhost:5432/postcraft_test'
   * })
   *
   * // Configure for production with longer timeout
   * const postcraft = new PostCraft({
   *   databaseUrl: process.env.POSTCRAFT_DATABASE_URL,
   *   timeout: 15000  // 15 second timeout for slower production database
   * })
   *
   * // Multiple SDK instances with different databases
   * const mainDb = new PostCraft({
   *   databaseUrl: process.env.MAIN_DATABASE_URL
   * })
   *
   * const cachingDb = new PostCraft({
   *   databaseUrl: process.env.CACHE_DATABASE_URL,
   *   cacheTtl: 600  // Cache for 10 minutes in this instance
   * })
   * ```
   */
  constructor(config?: PostCraftConfig) {
    this.config = {
      timeout: 5000,
      cacheTtl: 0,
      ...config,
    };

    // Get database URL from config or environment
    const databaseUrl =
      this.config.databaseUrl || process.env.POSTCRAFT_DATABASE_URL;

    if (!databaseUrl) {
      throw new DatabaseConnectionError(
        "Database URL not provided. Set POSTCRAFT_DATABASE_URL environment variable or pass databaseUrl in config."
      );
    }

    try {
      // Create PostgreSQL connection
      const client = postgres(databaseUrl, {
        max: 10, // connection pool size
        connect_timeout: Math.floor(this.config.timeout! / 1000), // convert to seconds
      });

      // Initialize Drizzle ORM
      this.db = drizzle(client, { schema });
    } catch (error) {
      throw new DatabaseConnectionError(
        `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Templates namespace for template-related operations
   */
  templates = {
    /**
     * Render a template with provided variables
     *
     * Loads a template by name from the database, generates HTML from its design JSON,
     * and substitutes merge tags with provided variable values. This is the primary
     * method for programmatic template rendering.
     *
     * Rendering Process:
     * 1. Query database for template by name (case-sensitive)
     * 2. Load template's react-email-editor design JSON and variable metadata
     * 3. Generate production HTML from design JSON with inline styles
     * 4. Extract merge tags ({{VARIABLE_NAME}}) from HTML
     * 5. Validate provided variables against metadata (type checking)
     * 6. Apply fallback values for missing optional variables
     * 7. Check for required variables and raise errors if missing
     * 8. Return fully rendered HTML with all merge tags replaced
     *
     * @param {string} name - Template name as defined in PostCraft studio.
     *   Case-sensitive matching. E.g., 'welcome-email', 'order-confirmation'
     *
     * @param {Record<string, any>} [variables] - Key-value pairs for merge tag substitution.
     *   Keys should match template variable names exactly. Values are validated against
     *   variable type metadata. If not provided, defaults to empty object (uses fallbacks).
     *   @example { NAME: 'Alice', EMAIL: 'alice@example.com', AGE: 30 }
     *
     * @returns {Promise<string>} Fully rendered HTML string suitable for email sending.
     *   HTML includes proper DOCTYPE, meta tags for email clients, inline CSS styles,
     *   and all merge tags replaced with actual values or fallbacks.
     *   @example '<html><head>...</head><body><p>Hello Alice...</p></body></html>'
     *
     * @throws {TemplateNotFoundError} If template name does not exist in database.
     *   Indicates typo in template name or template was deleted. Check that template
     *   was created in PostCraft studio at localhost:3579.
     *
     * @throws {TemplateVariableTypeError} If provided variable type does not match
     *   template variable metadata. E.g., passing string for number field.
     *   Check variable types in studio and ensure correct types sent to render().
     *
     * @throws {RequiredVariableMissingError} If required variable is not provided
     *   and has no fallback value. Required variables are marked in studio and must
     *   be provided at render time.
     *
     * @throws {DatabaseConnectionError} If database query fails due to connection
     *   issues, timeouts, or other database errors.
     *
     * @example
     * ```typescript
     * import { PostCraft, TemplateNotFoundError } from 'postcraft'
     *
     * const postcraft = new PostCraft()
     *
     * // Render template with all variables provided
     * try {
     *   const html = await postcraft.templates.render('welcome-email', {
     *     NAME: 'John Doe',
     *     EMAIL: 'john@example.com',
     *     VERIFICATION_URL: 'https://example.com/verify/abc123'
     *   })
     *   console.log('Rendered HTML:', html.substring(0, 100) + '...')
     * } catch (error) {
     *   if (error instanceof TemplateNotFoundError) {
     *     console.error(`Template not found: ${error.templateName}`)
     *   }
     * }
     * ```
     *
     * @example
     * ```typescript
     * // Render with optional variables (uses fallbacks)
     * const html = await postcraft.templates.render('newsletter', {
     *   RECIPIENT_NAME: 'Jane Smith'
     *   // ISSUE_NUMBER has fallback "Latest" in studio
     *   // UNSUBSCRIBE_URL has fallback in studio
     * })
     * ```
     *
     * @example
     * ```typescript
     * // Handle all error scenarios
     * try {
     *   const html = await postcraft.templates.render('order-confirmation', {
     *     ORDER_ID: 'ORD-12345',
     *     ORDER_DATE: new Date('2025-01-15'),
     *     TOTAL_AMOUNT: 99.99
     *   })
     * } catch (error) {
     *   if (error instanceof TemplateNotFoundError) {
     *     console.error(`Template "${error.templateName}" not found in database`)
     *   } else if (error instanceof TemplateVariableTypeError) {
     *     console.error(
     *       `Variable "${error.variableName}" should be ${error.expectedType}, ` +
     *       `got ${error.providedType}`
     *     )
     *   } else if (error instanceof RequiredVariableMissingError) {
     *     console.error(
     *       `Required variable "${error.variableName}" not provided and no fallback`
     *     )
     *   } else {
     *     console.error('Unknown error rendering template:', error)
     *   }
     * }
     * ```
     */
    render: async (
      name: string,
      variables?: Record<string, any>
    ): Promise<string> => {
      try {
        // Query template by name with variables joined
        const template = await this.db.query.templates.findFirst({
          where: eq(templates.name, name),
          with: {
            variables: true,
          },
        });

        if (!template) {
          throw new TemplateNotFoundError(name);
        }

        // Generate HTML from design JSON
        const html = renderDesignToHtml(template.content);

        // Substitute merge tags with provided variables
        const renderedHtml = substituteMergeTags(
          html,
          variables || {},
          template.variables || []
        );

        return renderedHtml;
      } catch (error: unknown) {
        // Re-throw known errors
        if (
          error instanceof TemplateNotFoundError ||
          error instanceof TemplateVariableTypeError ||
          error instanceof RequiredVariableMissingError
        ) {
          throw error;
        }

        // Wrap unknown errors as database connection errors
        throw new DatabaseConnectionError(
          `Failed to render template: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  };
}

// Re-export error classes for convenient imports
export {
  TemplateNotFoundError,
  TemplateVariableTypeError,
  RequiredVariableMissingError,
  DatabaseConnectionError,
} from "./errors";
