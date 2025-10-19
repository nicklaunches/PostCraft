/**
 * API Contract: Templates Endpoints
 *
 * Defines TypeScript interfaces for all template-related API endpoints.
 * These contracts ensure type safety between frontend and backend.
 */

// ============================================================================
// Shared Types
// ============================================================================

export type VariableType = 'string' | 'number' | 'boolean' | 'date'

export interface TemplateVariable {
  id: number
  templateId: number
  key: string // Uppercase merge tag name (e.g., "NAME", "AGE")
  type: VariableType
  fallbackValue: string | null // Stored as string, parsed by type
  isRequired: boolean
  createdAt: string // ISO 8601 timestamp
}

export interface Template {
  id: number
  name: string // Unique template identifier for SDK
  content: object // react-email-editor JSON structure
  html: string // Rendered HTML with merge tags (e.g., {{NAME}})
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

export interface TemplateWithVariables extends Template {
  variables: TemplateVariable[]
}

export interface PaginationMetadata {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

// ============================================================================
// GET /api/templates - List Templates with Pagination
// ============================================================================

export interface ListTemplatesQueryParams {
  page?: string // Default: "1"
  pageSize?: string // Default: "20"
}

export interface ListTemplatesResponse {
  items: Template[]
  pagination: PaginationMetadata
}

export interface ListTemplatesErrorResponse {
  error: string
  details?: string
}

/**
 * Example Request:
 * GET /api/templates?page=2&pageSize=20
 *
 * Example Success Response (200):
 * {
 *   "items": [
 *     {
 *       "id": 1,
 *       "name": "welcome-email",
 *       "content": { "body": { "rows": [...] } },
 *       "html": "<html>...</html>",
 *       "createdAt": "2025-10-18T12:00:00Z",
 *       "updatedAt": "2025-10-18T14:30:00Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 2,
 *     "pageSize": 20,
 *     "totalPages": 5,
 *     "totalCount": 87
 *   }
 * }
 *
 * Example Error Response (500):
 * {
 *   "error": "Database connection failed",
 *   "details": "Could not connect to POSTCRAFT_DATABASE_URL"
 * }
 */

// ============================================================================
// POST /api/templates - Create New Template
// ============================================================================

export interface CreateTemplateRequest {
  name: string // 1-100 chars, alphanumeric + hyphens/underscores
  content: object // react-email-editor JSON
  html: string // Rendered HTML with merge tags
  variables: Array<{
    key: string // Uppercase merge tag name
    type: VariableType
    fallbackValue: string | null
    isRequired: boolean
  }>
}

export interface CreateTemplateResponse {
  template: TemplateWithVariables
}

export interface CreateTemplateErrorResponse {
  error: string
  details?: string
  field?: string // Field name for validation errors
}

/**
 * Example Request:
 * POST /api/templates
 * Content-Type: application/json
 *
 * {
 *   "name": "password-reset",
 *   "content": { "body": { "rows": [...] } },
 *   "html": "<html>Hello {{NAME}}, reset your password...</html>",
 *   "variables": [
 *     {
 *       "key": "NAME",
 *       "type": "string",
 *       "fallbackValue": "User",
 *       "isRequired": false
 *     }
 *   ]
 * }
 *
 * Example Success Response (201):
 * {
 *   "template": {
 *     "id": 5,
 *     "name": "password-reset",
 *     "content": { "body": { "rows": [...] } },
 *     "html": "<html>Hello {{NAME}}, reset your password...</html>",
 *     "createdAt": "2025-10-18T15:00:00Z",
 *     "updatedAt": "2025-10-18T15:00:00Z",
 *     "variables": [
 *       {
 *         "id": 12,
 *         "templateId": 5,
 *         "key": "NAME",
 *         "type": "string",
 *         "fallbackValue": "User",
 *         "isRequired": false,
 *         "createdAt": "2025-10-18T15:00:00Z"
 *       }
 *     ]
 *   }
 * }
 *
 * Example Validation Error Response (400):
 * {
 *   "error": "Template name already exists",
 *   "field": "name",
 *   "details": "A template with name 'password-reset' already exists"
 * }
 */

// ============================================================================
// GET /api/templates/[id] - Get Single Template with Variables
// ============================================================================

export interface GetTemplateResponse {
  template: TemplateWithVariables
}

export interface GetTemplateErrorResponse {
  error: string
  details?: string
}

/**
 * Example Request:
 * GET /api/templates/5
 *
 * Example Success Response (200):
 * {
 *   "template": {
 *     "id": 5,
 *     "name": "password-reset",
 *     "content": { "body": { "rows": [...] } },
 *     "html": "<html>Hello {{NAME}}, reset your password...</html>",
 *     "createdAt": "2025-10-18T15:00:00Z",
 *     "updatedAt": "2025-10-18T15:00:00Z",
 *     "variables": [...]
 *   }
 * }
 *
 * Example Error Response (404):
 * {
 *   "error": "Template not found",
 *   "details": "No template with id 5 exists"
 * }
 */

// ============================================================================
// PUT /api/templates/[id] - Update Template
// ============================================================================

export interface UpdateTemplateRequest {
  content: object // react-email-editor JSON
  html: string // Rendered HTML with merge tags
  variables: Array<{
    key: string
    type: VariableType
    fallbackValue: string | null
    isRequired: boolean
  }>
}

export interface UpdateTemplateResponse {
  template: TemplateWithVariables
}

export interface UpdateTemplateErrorResponse {
  error: string
  details?: string
  field?: string
}

/**
 * Example Request:
 * PUT /api/templates/5
 * Content-Type: application/json
 *
 * {
 *   "content": { "body": { "rows": [...] } },
 *   "html": "<html>Updated content {{NAME}}...</html>",
 *   "variables": [
 *     {
 *       "key": "NAME",
 *       "type": "string",
 *       "fallbackValue": "User",
 *       "isRequired": false
 *     }
 *   ]
 * }
 *
 * Example Success Response (200):
 * {
 *   "template": {
 *     "id": 5,
 *     "name": "password-reset",
 *     "content": { "body": { "rows": [...] } },
 *     "html": "<html>Updated content {{NAME}}...</html>",
 *     "createdAt": "2025-10-18T15:00:00Z",
 *     "updatedAt": "2025-10-18T16:30:00Z",
 *     "variables": [...]
 *   }
 * }
 *
 * Example Error Response (404):
 * {
 *   "error": "Template not found"
 * }
 */

// ============================================================================
// DELETE /api/templates/[id] - Delete Template
// ============================================================================

export interface DeleteTemplateResponse {
  success: true
  message: string
}

export interface DeleteTemplateErrorResponse {
  error: string
  details?: string
}

/**
 * Example Request:
 * DELETE /api/templates/5
 *
 * Example Success Response (200):
 * {
 *   "success": true,
 *   "message": "Template 'password-reset' deleted successfully"
 * }
 *
 * Example Error Response (404):
 * {
 *   "error": "Template not found"
 * }
 */
