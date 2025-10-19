/**
 * @fileoverview API request validation utilities
 *
 * Provides schema validation functions for all API endpoints to ensure
 * request bodies match the contract specifications defined in
 * specs/001-local-studio-dashboard/contracts/api-templates.ts
 *
 * Validates:
 * - POST /api/templates: name, content, variables array
 * - PUT /api/templates/[id]: content, variables array
 * - GET /api/templates: pagination parameters (page, pageSize)
 *
 * Validation is performed at the API route handler level before database
 * operations to catch malformed requests early and provide clear error
 * messages to the client.
 *
 * **Design Philosophy:**
 * - Fail fast with clear error messages
 * - Validate structure before type checking
 * - Return detailed error information for debugging
 * - Support both validation and type inference for TypeScript
 *
 * @see {@link /specs/001-local-studio-dashboard/contracts/api-templates.ts} API contracts
 *
 * @example
 * // Validate POST /api/templates request
 * const { valid, errors, data } = validateCreateTemplateRequest(body);
 * if (!valid) {
 *   return NextResponse.json({ error: errors[0] }, { status: 400 });
 * }
 * const { name, content, variables } = data; // Type-safe
 *
 * @example
 * // Validate PUT /api/templates/[id] request
 * const validation = validateUpdateTemplateRequest(body);
 * if (!validation.valid) {
 *   return NextResponse.json(
 *     { error: validation.errors[0], field: validation.field },
 *     { status: 400 }
 *   );
 * }
 */

import { VariableType } from './variable-validation';

/**
 * Validation result type used across all validators
 */
export interface ValidationResult<T = any> {
  valid: boolean;
  errors: string[];
  data?: T;
  field?: string; // Field name where validation failed
}

/**
 * Typed request bodies for API contracts
 */
export interface CreateTemplateRequestBody {
  name: string;
  content: any;
  html?: string;
  variables?: Array<{
    key: string;
    type: VariableType;
    fallbackValue: string | null;
    isRequired: boolean;
  }>;
}

export interface UpdateTemplateRequestBody {
  content: any;
  html?: string;
  variables?: Array<{
    key: string;
    type: VariableType;
    fallbackValue: string | null;
    isRequired: boolean;
  }>;
}

/**
 * Validates a variable object from request body
 *
 * @param variable - Variable object to validate
 * @param index - Index in variables array (for error reporting)
 * @returns ValidationResult with errors if any
 */
function validateVariable(
  variable: any,
  index: number
): ValidationResult {
  const errors: string[] = [];

  if (!variable) {
    errors.push(`Variable at index ${index} is missing`);
    return { valid: false, errors };
  }

  if (typeof variable !== 'object') {
    errors.push(
      `Variable at index ${index} must be an object, got ${typeof variable}`
    );
    return { valid: false, errors };
  }

  // Validate key
  if (!variable.key) {
    errors.push(`Variable at index ${index} is missing required field: key`);
  } else if (typeof variable.key !== 'string') {
    errors.push(
      `Variable at index ${index} field "key" must be string, got ${typeof variable.key}`
    );
  } else if (!/^[A-Z_][A-Z_0-9]*$/.test(variable.key)) {
    errors.push(
      `Variable at index ${index} field "key" must be uppercase letters, underscores, and numbers (e.g., "USER_NAME")`
    );
  }

  // Validate type
  if (!variable.type) {
    errors.push(
      `Variable at index ${index} is missing required field: type`
    );
  } else if (!['string', 'number', 'boolean', 'date'].includes(variable.type)) {
    errors.push(
      `Variable at index ${index} field "type" must be one of: string, number, boolean, date. Got: ${variable.type}`
    );
  }

  // Validate fallbackValue is string or null
  if (variable.fallbackValue !== null && variable.fallbackValue !== undefined) {
    if (typeof variable.fallbackValue !== 'string') {
      errors.push(
        `Variable at index ${index} field "fallbackValue" must be string or null, got ${typeof variable.fallbackValue}`
      );
    }
  }

  // Validate isRequired is boolean
  if (variable.isRequired !== undefined && variable.isRequired !== null) {
    if (typeof variable.isRequired !== 'boolean') {
      errors.push(
        `Variable at index ${index} field "isRequired" must be boolean, got ${typeof variable.isRequired}`
      );
    }
  }

  // Validate business rule: required variables cannot have fallbacks
  if (
    variable.isRequired === true &&
    variable.fallbackValue !== null &&
    variable.fallbackValue !== undefined
  ) {
    errors.push(
      `Variable at index ${index} (${variable.key}): required variables cannot have fallback values`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    data: variable,
  };
}

/**
 * Validates POST /api/templates request body
 *
 * Validates:
 * - name: Required string, 1-100 chars, alphanumeric + hyphens/underscores
 * - content: Required object (react-email-editor JSON)
 * - variables: Optional array of variable objects with proper schema
 *
 * @param body - Request body to validate
 * @returns ValidationResult with typed data if valid
 *
 * @example
 * const result = validateCreateTemplateRequest({
 *   name: 'welcome-email',
 *   content: { body: { rows: [] } },
 *   variables: [{ key: 'NAME', type: 'string', fallbackValue: null, isRequired: true }]
 * });
 * if (result.valid) {
 *   const { name, content, variables } = result.data;
 * }
 */
export function validateCreateTemplateRequest(
  body: any
): ValidationResult<CreateTemplateRequestBody> {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a JSON object');
    return { valid: false, errors };
  }

  // Validate name
  if (!body.name) {
    errors.push('Request body missing required field: name');
  } else if (typeof body.name !== 'string') {
    errors.push(`Field "name" must be string, got ${typeof body.name}`);
  } else if (body.name.trim().length === 0) {
    errors.push('Field "name" cannot be empty or whitespace only');
  } else if (body.name.length > 100) {
    errors.push('Field "name" cannot exceed 100 characters');
  } else if (!/^[a-zA-Z0-9_-]{1,100}$/.test(body.name)) {
    errors.push(
      'Field "name" can only contain alphanumeric characters, hyphens, and underscores'
    );
  }

  // Validate content
  if (!body.content) {
    errors.push('Request body missing required field: content');
  } else if (typeof body.content !== 'object') {
    errors.push(`Field "content" must be object, got ${typeof body.content}`);
  } else if (body.content === null) {
    errors.push('Field "content" cannot be null');
  }

  // Validate html (optional)
  if (body.html !== undefined && body.html !== null) {
    if (typeof body.html !== 'string') {
      errors.push(`Field "html" must be string, got ${typeof body.html}`);
    }
  }

  // Validate variables (optional)
  if (body.variables !== undefined && body.variables !== null) {
    if (!Array.isArray(body.variables)) {
      errors.push(
        `Field "variables" must be array, got ${typeof body.variables}`
      );
    } else {
      for (let i = 0; i < body.variables.length; i++) {
        const varResult = validateVariable(body.variables[i], i);
        if (!varResult.valid) {
          errors.push(...varResult.errors);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      name: body.name,
      content: body.content,
      html: body.html,
      variables: body.variables || [],
    },
  };
}

/**
 * Validates PUT /api/templates/[id] request body
 *
 * Validates:
 * - content: Required object (react-email-editor JSON)
 * - variables: Optional array of variable objects with proper schema
 *
 * @param body - Request body to validate
 * @returns ValidationResult with typed data if valid
 *
 * @example
 * const result = validateUpdateTemplateRequest({
 *   content: { body: { rows: [] } },
 *   variables: []
 * });
 * if (result.valid) {
 *   const { content, variables } = result.data;
 * }
 */
export function validateUpdateTemplateRequest(
  body: any
): ValidationResult<UpdateTemplateRequestBody> {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a JSON object');
    return { valid: false, errors };
  }

  // Validate content (required)
  if (!body.content) {
    errors.push('Request body missing required field: content');
  } else if (typeof body.content !== 'object') {
    errors.push(`Field "content" must be object, got ${typeof body.content}`);
  } else if (body.content === null) {
    errors.push('Field "content" cannot be null');
  }

  // Validate html (optional)
  if (body.html !== undefined && body.html !== null) {
    if (typeof body.html !== 'string') {
      errors.push(`Field "html" must be string, got ${typeof body.html}`);
    }
  }

  // Validate variables (optional)
  if (body.variables !== undefined && body.variables !== null) {
    if (!Array.isArray(body.variables)) {
      errors.push(
        `Field "variables" must be array, got ${typeof body.variables}`
      );
    } else {
      for (let i = 0; i < body.variables.length; i++) {
        const varResult = validateVariable(body.variables[i], i);
        if (!varResult.valid) {
          errors.push(...varResult.errors);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      content: body.content,
      html: body.html,
      variables: body.variables || [],
    },
  };
}

/**
 * Validates pagination query parameters
 *
 * Validates:
 * - page: Optional string, must parse to positive integer
 * - pageSize: Optional string, must parse to positive integer (1-100)
 *
 * @param page - Page parameter as string
 * @param pageSize - PageSize parameter as string
 * @returns ValidationResult with parsed numeric values
 *
 * @example
 * const result = validatePaginationParams('2', '20');
 * if (result.valid) {
 *   const { page, pageSize } = result.data;
 *   // page = 2, pageSize = 20
 * }
 */
export function validatePaginationParams(
  page?: string,
  pageSize?: string
): ValidationResult<{ page: number; pageSize: number }> {
  const errors: string[] = [];

  // Parse page
  const pageNum = page ? parseInt(page, 10) : 1;
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('Query parameter "page" must be a positive integer');
  }

  // Parse pageSize
  const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
  if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
    errors.push(
      'Query parameter "pageSize" must be a positive integer between 1 and 100'
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      page: Math.max(1, pageNum),
      pageSize: Math.min(100, Math.max(1, pageSizeNum)),
    },
  };
}
