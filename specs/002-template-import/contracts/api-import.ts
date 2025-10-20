/**
 * @fileoverview API Contract: Template Import from ZIP File
 *
 * Defines TypeScript interfaces for the POST /api/templates/import endpoint,
 * including request validation schemas, response types, and error contracts.
 *
 * This contract serves as the source of truth for:
 * - Frontend components making import requests
 * - Backend API route handlers processing imports
 * - Contract tests validating API behavior
 * - SDK consumers (if feature is exposed via SDK)
 *
 * @see {@link /specs/002-template-import/spec.md} Feature specification
 * @see {@link /specs/002-template-import/data-model.md} Database schema
 */

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request payload for importing a template from a ZIP file.
 *
 * Sent as `multipart/form-data` with file upload and template metadata.
 *
 * @example
 * // Frontend usage with FormData
 * const formData = new FormData();
 * formData.append('file', zipFile); // File object from input
 * formData.append('name', 'Black Friday Sale');
 *
 * const response = await fetch('/api/templates/import', {
 *   method: 'POST',
 *   body: formData,
 * });
 */
export interface ImportTemplateRequest {
  /**
   * ZIP file containing index.html and optional images folder.
   *
   /**
 * Constraints:
 * - MIME type: application/zip, application/x-zip-compressed
 * - Max size: 20 MB (20,971,520 bytes)
 * - Must contain index.html at root or first level
   * - Image files must match allowed formats: PNG, JPG, JPEG, GIF, WebP, SVG
   */
  file: File | Blob;

  /**
   * User-provided name for the template.
   *
   * Constraints:
   * - Min length: 1 character
   * - Max length: 200 characters
   * - Must be unique within the user's template library
   * - Trimmed of leading/trailing whitespace
   *
   * @example "Welcome Email"
   * @example "Black Friday Sale 2025"
   */
  name: string;
}

/**
 * Validation schema for import request (Zod schema for runtime validation).
 *
 * @example
 * import { z } from 'zod';
 *
 * const importRequestSchema = z.object({
 *   file: z.instanceof(File)
 *     .refine((file) => file.size <= 20 * 1024 * 1024, {
 *       message: 'File size must not exceed 20 MB',
 *     })
 *     .refine((file) => file.type === 'application/zip' || file.type === 'application/x-zip-compressed', {
 *       message: 'File must be a ZIP archive',
 *     }),
 *   name: z.string()
 *     .trim()
 *     .min(1, 'Template name is required')
 *     .max(200, 'Template name must not exceed 200 characters'),
 * });
 */

// ============================================================================
// Response Types
// ============================================================================

/**
 * Successful import response with created template details.
 *
 * @example
 * {
 *   success: true,
 *   data: {
 *     template: {
 *       id: 42,
 *       name: "Black Friday Sale",
 *       html: "<html>...</html>",
 *       source: "import",
 *       createdAt: "2025-10-19T10:30:00Z",
 *       updatedAt: "2025-10-19T10:30:00Z"
 *     },
 *     assets: [
 *       {
 *         id: 101,
 *         originalPath: "images/logo.png",
 *         s3Url: "https://s3.amazonaws.com/bucket/postcraft/templates/uuid/images/logo.png",
 *         mimeType: "image/png",
 *         fileSize: 45231
 *       }
 *     ],
 *     stats: {
 *       htmlSize: 12450,
 *       imageCount: 5,
 *       totalAssetSize: 234560,
 *       processingTime: 3241
 *     }
 *   }
 * }
 */
export interface ImportTemplateSuccessResponse {
  /** Indicates successful import */
  success: true;

  /** Import result data */
  data: {
    /** Created template record */
    template: {
      /** Database ID */
      id: number;

      /** User-provided template name */
      name: string;

      /** Imported HTML with S3 image URLs */
      html: string;

      /** Source type (always "import" for this endpoint) */
      source: "import";

      /** ISO 8601 timestamp */
      createdAt: string;

      /** ISO 8601 timestamp */
      updatedAt: string;
    };

    /** Uploaded image assets */
    assets: Array<{
      /** Database ID */
      id: number;

      /** Original path in ZIP (e.g., "images/logo.png") */
      originalPath: string;

      /** S3 URL for accessing the image */
      s3Url: string;

      /** MIME type (e.g., "image/png") */
      mimeType: string;

      /** File size in bytes */
      fileSize: number;
    }>;

    /** Import statistics */
    stats: {
      /** HTML content size in bytes */
      htmlSize: number;

      /** Number of images extracted and uploaded */
      imageCount: number;

      /** Total size of all uploaded assets in bytes */
      totalAssetSize: number;

      /** Processing time in milliseconds */
      processingTime: number;
    };
  };
}

/**
 * Error response for failed import.
 *
 * @example
 * // Validation error
 * {
 *   success: false,
 *   error: {
 *     code: "VALIDATION_ERROR",
 *     message: "ZIP file must contain an index.html file",
 *     details: {
 *       filesFound: ["readme.txt", "images/logo.png"],
 *       expectedFile: "index.html"
 *     }
 *   }
 * }
 *
 * @example
 * // Duplicate name error
 * {
 *   success: false,
 *   error: {
 *     code: "DUPLICATE_NAME",
 *     message: "A template with the name 'Welcome Email' already exists",
 *     details: {
 *       existingTemplateId: 15,
 *       providedName: "Welcome Email"
 *     }
 *   }
 * }
 */
export interface ImportTemplateErrorResponse {
  /** Indicates failed import */
  success: false;

  /** Error details */
  error: {
    /** Machine-readable error code */
    code: ImportErrorCode;

    /** Human-readable error message */
    message: string;

    /** Additional error context (optional) */
    details?: Record<string, unknown>;
  };
}

/**
 * Union type for all possible import responses.
 */
export type ImportTemplateResponse =
  | ImportTemplateSuccessResponse
  | ImportTemplateErrorResponse;

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Enumeration of all possible error codes for import operations.
 *
 * Maps to HTTP status codes:
 * - 400: VALIDATION_ERROR, INVALID_ZIP, MISSING_INDEX_HTML, DUPLICATE_NAME, FILE_TOO_LARGE, INVALID_IMAGE_FORMAT
 * - 500: S3_UPLOAD_FAILED, DATABASE_ERROR, ZIP_EXTRACTION_FAILED, INTERNAL_ERROR
 * - 503: S3_NOT_CONFIGURED
 */
export type ImportErrorCode =
  | "VALIDATION_ERROR" // Generic validation failure (e.g., empty name)
  | "INVALID_ZIP" // File is not a valid ZIP archive or is corrupted
  | "MISSING_INDEX_HTML" // ZIP does not contain index.html at root/first level
  | "DUPLICATE_NAME" // Template name already exists in database
  | "FILE_TOO_LARGE" // ZIP file exceeds 20 MB size limit
  | "INVALID_IMAGE_FORMAT" // Image file has unsupported format (not PNG/JPG/GIF/WebP/SVG)
  | "S3_UPLOAD_FAILED" // Failed to upload image to S3 (network error, permissions)
  | "S3_NOT_CONFIGURED" // Required S3 environment variables are missing
  | "DATABASE_ERROR" // Database operation failed (insert template/assets)
  | "ZIP_EXTRACTION_FAILED" // Failed to extract ZIP contents (corrupt file, memory error)
  | "INTERNAL_ERROR"; // Unexpected server error (catch-all)

/**
 * Maps error codes to HTTP status codes.
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<ImportErrorCode, number> = {
  VALIDATION_ERROR: 400,
  INVALID_ZIP: 400,
  MISSING_INDEX_HTML: 400,
  DUPLICATE_NAME: 400,
  FILE_TOO_LARGE: 400,
  INVALID_IMAGE_FORMAT: 400,
  S3_UPLOAD_FAILED: 500,
  S3_NOT_CONFIGURED: 503,
  DATABASE_ERROR: 500,
  ZIP_EXTRACTION_FAILED: 500,
  INTERNAL_ERROR: 500,
};

// ============================================================================
// Configuration Check Types
// ============================================================================

/**
 * Response for GET /api/templates/import/config endpoint.
 *
 * Used by frontend to check if S3 is configured before showing import UI.
 *
 * @example
 * // S3 configured
 * {
 *   configured: true,
 *   missingVars: []
 * }
 *
 * @example
 * // S3 not configured
 * {
 *   configured: false,
 *   missingVars: ["POSTCRAFT_S3_BUCKET", "POSTCRAFT_S3_ACCESS_KEY_ID"]
 * }
 */
export interface ImportConfigResponse {
  /** Whether all required S3 environment variables are configured */
  configured: boolean;

  /** List of missing environment variable names (empty if configured) */
  missingVars: string[];
}

/**
 * Required S3 environment variables for import functionality.
 */
export const REQUIRED_S3_ENV_VARS = [
  "POSTCRAFT_S3_BUCKET",
  "POSTCRAFT_S3_REGION",
  "POSTCRAFT_S3_ACCESS_KEY_ID",
  "POSTCRAFT_S3_SECRET_ACCESS_KEY",
] as const;

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Maximum allowed ZIP file size in bytes (20 MB).
 */
export const MAX_ZIP_SIZE = 20 * 1024 * 1024; // 20,971,520 bytes

/**
 * Maximum allowed template name length in characters.
 */
export const MAX_NAME_LENGTH = 200;

/**
 * Allowed image MIME types for extracted assets.
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

/**
 * Allowed image file extensions (case-insensitive).
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
] as const;

/**
 * Expected HTML filename in ZIP archive.
 */
export const REQUIRED_HTML_FILENAME = "index.html";

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is a success response.
 *
 * @example
 * const response = await fetch('/api/templates/import', { ... });
 * const data = await response.json();
 *
 * if (isImportSuccess(data)) {
 *   console.log('Template created:', data.data.template.id);
 * } else {
 *   console.error('Import failed:', data.error.message);
 * }
 */
export function isImportSuccess(
  response: ImportTemplateResponse
): response is ImportTemplateSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if response is an error response.
 */
export function isImportError(
  response: ImportTemplateResponse
): response is ImportTemplateErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if MIME type is allowed for images.
 */
export function isAllowedImageMimeType(
  mimeType: string
): mimeType is typeof ALLOWED_IMAGE_MIME_TYPES[number] {
  return ALLOWED_IMAGE_MIME_TYPES.includes(
    mimeType as typeof ALLOWED_IMAGE_MIME_TYPES[number]
  );
}

/**
 * Type guard to check if file extension is allowed for images.
 */
export function isAllowedImageExtension(
  extension: string
): extension is typeof ALLOWED_IMAGE_EXTENSIONS[number] {
  return ALLOWED_IMAGE_EXTENSIONS.includes(
    extension.toLowerCase() as typeof ALLOWED_IMAGE_EXTENSIONS[number]
  );
}
