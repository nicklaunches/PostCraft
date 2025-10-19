/**
 * PostCraft SDK - Programmatic Email Template Rendering
 * 
 * This SDK provides a Resend-style API for rendering email templates with variable substitution.
 * Templates are defined in the PostCraft local studio and rendered programmatically via this SDK.
 * 
 * @example
 * ```typescript
 * import { PostCraft } from 'postcraft'
 * 
 * const postcraft = new PostCraft()
 * const html = await postcraft.templates.render('welcome-email', {
 *   NAME: 'John Doe',
 *   AGE: 30
 * })
 * ```
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
   * @param config Optional configuration object
   * @throws {DatabaseConnectionError} If database connection cannot be established
   * 
   * @example
   * ```typescript
   * // Use default POSTCRAFT_DATABASE_URL from environment
   * const postcraft = new PostCraft()
   * 
   * // Override database URL
   * const postcraft = new PostCraft({
   *   databaseUrl: 'postgresql://user:pass@host/db'
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
