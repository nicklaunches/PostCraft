/**
 * SDK Error Classes
 * 
 * Custom error types for the PostCraft SDK following the contract specification.
 * These errors provide structured error handling for template rendering operations.
 */

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
