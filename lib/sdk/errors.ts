/**
 * SDK Error Classes
 *
 * Custom error types for the PostCraft SDK providing structured error handling for template
 * rendering operations. Each error class extends Error and provides context-specific information
 * to help developers diagnose and handle template rendering issues.
 *
 * Error Hierarchy:
 * - TemplateNotFoundError: Template does not exist in database
 * - TemplateVariableTypeError: Variable value type mismatch
 * - RequiredVariableMissingError: Required variable not provided or has no fallback
 * - DatabaseConnectionError: Database connection or query failure
 *
 * Usage Pattern - Try/Catch:
 * ```typescript
 * import {
 *   PostCraft,
 *   TemplateNotFoundError,
 *   TemplateVariableTypeError,
 *   RequiredVariableMissingError,
 *   DatabaseConnectionError
 * } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * try {
 *   const html = await postcraft.templates.render('welcome-email', {
 *     USER_NAME: 'Alice',
 *     USER_AGE: 30
 *   })
 * } catch (error) {
 *   if (error instanceof TemplateNotFoundError) {
 *     // Handle missing template
 *   } else if (error instanceof TemplateVariableTypeError) {
 *     // Handle type mismatch
 *   } else if (error instanceof RequiredVariableMissingError) {
 *     // Handle missing required variable
 *   } else if (error instanceof DatabaseConnectionError) {
 *     // Handle database error
 *   }
 * }
 * ```
 *
 * Error Recovery Strategies:
 *
 * **TemplateNotFoundError Recovery:**
 * - Check template name spelling matches exactly (case-sensitive)
 * - Verify template exists in PostCraft studio (localhost:3579/templates)
 * - If template was deleted, recreate it in studio
 * - Implement fallback template for graceful degradation
 *
 * **TemplateVariableTypeError Recovery:**
 * - Check variable type in template metadata (studio)
 * - Convert provided value to correct type
 * - Log type information for debugging
 * - Implement validation before render() call
 *
 * **RequiredVariableMissingError Recovery:**
 * - Add missing variable to render call
 * - Check if variable should have fallback value
 * - Verify variable name matches exactly (uppercase, underscores)
 * - Review template definition in studio
 *
 * **DatabaseConnectionError Recovery:**
 * - Check database server is running and accessible
 * - Verify POSTCRAFT_DATABASE_URL is correct and secret is valid
 * - Check network connectivity if using remote database
 * - Verify connection pool limits not exceeded
 * - Implement retry logic with exponential backoff
 *
 * Logging Strategy:
 * ```typescript
 * try {
 *   const html = await postcraft.templates.render(templateName, variables)
 * } catch (error) {
 *   if (error instanceof TemplateNotFoundError) {
 *     console.warn(`Template not found: ${error.templateName}`)
 *   } else if (error instanceof TemplateVariableTypeError) {
 *     console.error(
 *       `Type error for ${error.variableName}: ` +
 *       `expected ${error.expectedType}, got ${error.providedType}`
 *     )
 *   } else if (error instanceof RequiredVariableMissingError) {
 *     console.error(`Required variable missing: ${error.variableName}`)
 *   } else if (error instanceof DatabaseConnectionError) {
 *     console.error(`Database error: ${error.details}`)
 *     // Implement retry or fallback
 *   }
 *   throw error  // Re-throw or handle appropriately
 * }
 * ```
 *
 * @module errors
 * @exports TemplateNotFoundError
 * @exports TemplateVariableTypeError
 * @exports RequiredVariableMissingError
 * @exports DatabaseConnectionError
 */

/**
 * Thrown when a template with the specified name does not exist in the database
 *
 * Indicates that the template name provided to render() does not match any template
 * stored in the PostCraft database. This is typically due to:
 * - Template name typo (remember: names are case-sensitive)
 * - Template was deleted from studio
 * - Template has not been created yet
 * - Wrong database or environment configured
 *
 * Properties:
 * - name: Always 'TemplateNotFoundError'
 * - message: Template "{templateName}" not found
 * - templateName: The name that was searched for (public property)
 *
 * How to Fix:
 * 1. Verify template name spelling exactly (case-sensitive)
 * 2. Check template exists in studio: Visit localhost:3579/templates
 * 3. Verify POSTCRAFT_DATABASE_URL points to correct database with templates
 * 4. If template deleted, recreate it in studio
 * 5. Use try/catch to handle gracefully with fallback template
 *
 * @class TemplateNotFoundError
 * @extends Error
 *
 * @param {string} templateName - The template name that was not found
 *
 * @example
 * ```typescript
 * import { PostCraft, TemplateNotFoundError } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * try {
 *   const html = await postcraft.templates.render('nonexistent-template', {})
 * } catch (error) {
 *   if (error instanceof TemplateNotFoundError) {
 *     console.error(`Template not found: ${error.templateName}`)
 *     // Log to monitoring, use default template, etc.
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Check template exists before rendering
 * const templateName = 'welcome-email'
 *
 * try {
 *   const html = await postcraft.templates.render(templateName, {
 *     USER_NAME: 'John Doe'
 *   })
 * } catch (error) {
 *   if (error instanceof TemplateNotFoundError) {
 *     console.warn(`Template "${templateName}" not in database`)
 *     // Use generic email template or plaintext fallback
 *     const fallbackHtml = generateFallbackEmail('John Doe')
 *     await emailService.send({ to: 'john@example.com', html: fallbackHtml })
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Implement custom error handling with retry/notification
 * async function renderTemplateWithFallback(name, variables) {
 *   try {
 *     return await postcraft.templates.render(name, variables)
 *   } catch (error) {
 *     if (error instanceof TemplateNotFoundError) {
 *       // Log alert - may indicate deployment issue
 *       await alertService.notify({
 *         level: 'warning',
 *         message: `Template "${error.templateName}" missing in production`,
 *         template: error.templateName
 *       })
 *       // Use fallback template that always exists
 *       return getFallbackTemplate()
 *     }
 *     throw error
 *   }
 * }
 * ```
 */
export class TemplateNotFoundError extends Error {
  constructor(public templateName: string) {
    super(`Template "${templateName}" not found`)
    this.name = 'TemplateNotFoundError'
  }
}

/**
 * Thrown when a variable value type does not match the template variable's metadata type
 *
 * Indicates that a value provided in the render() call does not match the variable's
 * declared type in template metadata. This is a runtime type validation error that helps
 * catch bugs where incorrect types are passed to render().
 *
 * Common Scenarios:
 * - Passing string "30" instead of number 30 for {{AGE}}
 * - Passing string "true" instead of boolean true for {{IS_ACTIVE}}
 * - Passing string date instead of Date object for {{CREATED_AT}}
 * - Passing number 123 instead of string "123" for {{USER_ID}}
 *
 * Type Rules (from html-renderer):
 * - **string**: JavaScript string, no conversion. E.g., 'John Doe'
 * - **number**: JavaScript number, must pass isNaN check. E.g., 30 (not "30")
 * - **boolean**: JavaScript boolean, no coercion. E.g., true (not "true" or 1)
 * - **date**: Date object or valid date string. E.g., new Date() or '2025-01-15'
 *
 * Properties:
 * - name: Always 'TemplateVariableTypeError'
 * - message: Variable "{variableName}" expected type {expectedType}, got {providedType}
 * - variableName: The variable that had the type mismatch (public property)
 * - expectedType: The required type from metadata (public property)
 * - providedType: The actual JavaScript type provided (public property)
 *
 * How to Fix:
 * 1. Check template metadata in studio for correct variable type
 * 2. Convert provided value to correct type before render()
 * 3. Implement type checking in consuming code
 * 4. Use TypeScript to catch at compile time
 *
 * @class TemplateVariableTypeError
 * @extends TypeError
 *
 * @param {string} variableName - The variable name with type mismatch
 * @param {string} expectedType - The expected type from metadata ('string', 'number', 'boolean', 'date')
 * @param {string} providedType - The actual JavaScript type provided (from typeof operator)
 *
 * @example
 * ```typescript
 * import { PostCraft, TemplateVariableTypeError } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * try {
 *   // Template expects AGE as number, but string provided
 *   const html = await postcraft.templates.render('user-profile', {
 *     NAME: 'John',
 *     AGE: '30'  // ❌ String, but template expects number
 *   })
 * } catch (error) {
 *   if (error instanceof TemplateVariableTypeError) {
 *     console.error(
 *       `Type mismatch: ${error.variableName} should be ${error.expectedType}, ` +
 *       `got ${error.providedType}`
 *     )
 *     // Convert and retry
 *     const html = await postcraft.templates.render('user-profile', {
 *       NAME: 'John',
 *       AGE: parseInt('30', 10)  // ✅ Convert to number
 *     })
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Prevent type errors with type checking
 * const renderProfile = async (userId: string, age: number, isActive: boolean) => {
 *   try {
 *     return await postcraft.templates.render('profile', {
 *       USER_ID: userId,
 *       AGE: age,              // ✅ Already number type
 *       IS_ACTIVE: isActive    // ✅ Already boolean type
 *     })
 *   } catch (error) {
 *     if (error instanceof TemplateVariableTypeError) {
 *       throw new Error(
 *         `Invalid variable: ${error.variableName} should be ${error.expectedType}`
 *       )
 *     }
 *     throw error
 *   }
 * }
 *
 * renderProfile('user-123', 30, true)    // ✅ Works
 * renderProfile('user-123', '30', true)  // ❌ TypeScript compile error
 * ```
 *
 * @example
 * ```typescript
 * // Handle type conversion in middleware
 * function convertVariablesToTypes(variables, metadata) {
 *   return Object.entries(variables).reduce((acc, [key, value]) => {
 *     const meta = metadata.find(m => m.key === key)
 *     if (!meta) {
 *       acc[key] = value
 *       return acc
 *     }
 *
 *     switch (meta.type) {
 *       case 'number':
 *         acc[key] = Number(value)
 *         break
 *       case 'boolean':
 *         acc[key] = value === true || value === 'true'
 *         break
 *       case 'date':
 *         acc[key] = new Date(value)
 *         break
 *       default:
 *         acc[key] = String(value)
 *     }
 *     return acc
 *   }, {})
 * }
 *
 * const html = await postcraft.templates.render('email', {
 *   AGE: '30',  // Raw string from form input
 *   CREATED_AT: '2025-01-15'
 * })
 * ```
 */
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

/**
 * Thrown when a required template variable is not provided and has no fallback value
 *
 * Indicates that a merge tag in the template is marked as "required" in the studio and:
 * 1. The variable was not provided in the render() call, AND
 * 2. No fallback value was configured for that variable
 *
 * This error helps ensure critical data is always provided. Common required variables:
 * - {{ORDER_ID}}: Required for order confirmation emails
 * - {{USER_EMAIL}}: Required for account emails
 * - {{VERIFICATION_TOKEN}}: Required for verification emails
 * - {{UNSUBSCRIBE_URL}}: Optional or required depending on email type
 *
 * Difference from Other Errors:
 * - TemplateNotFoundError: Template itself doesn't exist
 * - RequiredVariableMissingError: Template exists but required data missing
 * - TemplateVariableTypeError: Data provided but wrong type
 *
 * Properties:
 * - name: Always 'RequiredVariableMissingError'
 * - message: Required variable "{variableName}" is missing and has no fallback
 * - variableName: The required variable that is missing (public property)
 *
 * How to Fix:
 * 1. Check which variable is missing from error message
 * 2. Provide that variable in render() call
 * 3. Or configure fallback value in studio for that variable
 * 4. Or mark variable as optional in studio if appropriate
 *
 * Common Patterns:
 * - Check variable exists in source data before render()
 * - Use fallback if available in studio (won't need to provide)
 * - Raise error earlier if data not available (fail fast)
 * - Log which variables were missing for debugging
 *
 * @class RequiredVariableMissingError
 * @extends Error
 *
 * @param {string} variableName - The required variable that is missing
 *
 * @example
 * ```typescript
 * import { PostCraft, RequiredVariableMissingError } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * try {
 *   // Template requires ORDER_ID, but not provided
 *   const html = await postcraft.templates.render('order-confirmation', {
 *     CUSTOMER_NAME: 'John Doe'
 *     // ORDER_ID missing!
 *   })
 * } catch (error) {
 *   if (error instanceof RequiredVariableMissingError) {
 *     console.error(`Missing required variable: ${error.variableName}`)
 *     // Handle gracefully - don't send email without order ID
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Ensure required variables before rendering
 * async function sendOrderConfirmation(order) {
 *   // Validate required data exists
 *   if (!order.id || !order.customerId) {
 *     throw new Error('Missing required order data')
 *   }
 *
 *   try {
 *     const html = await postcraft.templates.render('order-confirmation', {
 *       ORDER_ID: order.id,
 *       CUSTOMER_NAME: order.customerName,
 *       TOTAL_AMOUNT: order.totalAmount
 *       // All required variables provided
 *     })
 *
 *     await emailService.send({
 *       to: order.customerEmail,
 *       html
 *     })
 *   } catch (error) {
 *     if (error instanceof RequiredVariableMissingError) {
 *       console.error(`Cannot send email - ${error.message}`)
 *       // Log incident for investigation
 *       await alertService.notifyMissingData(order.id, error.variableName)
 *     }
 *     throw error
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handle with optional chaining and provide fallback
 * const renderEmail = async (user, order) => {
 *   const variables = {
 *     USER_NAME: user?.name || 'Customer',
 *     ORDER_ID: order?.id,  // Could be undefined
 *     ORDER_DATE: new Date(order?.createdAt),
 *     SHIPPING_ADDRESS: order?.shippingAddress?.formatted || ''
 *   }
 *
 *   try {
 *     // Remove undefined variables - let template use fallbacks
 *     const cleanVariables = Object.entries(variables)
 *       .filter(([, value]) => value !== undefined && value !== null)
 *       .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
 *
 *     return await postcraft.templates.render('order-notification', cleanVariables)
 *   } catch (error) {
 *     if (error instanceof RequiredVariableMissingError) {
 *       console.error(
 *         `Cannot render template - required data missing: ${error.variableName}`
 *       )
 *       // Decide: fail loudly (production) or use fallback (development)
 *       if (process.env.NODE_ENV === 'production') {
 *         throw error  // Don't send broken email
 *       } else {
 *         return getPlaintextFallback(order)
 *       }
 *     }
 *     throw error
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Monitoring: Track missing variables across templates
 * const requiredVariablesMissing = new Map()
 *
 * async function renderWithTracking(templateName, variables) {
 *   try {
 *     return await postcraft.templates.render(templateName, variables)
 *   } catch (error) {
 *     if (error instanceof RequiredVariableMissingError) {
 *       const key = `${templateName}:${error.variableName}`
 *       requiredVariablesMissing.set(
 *         key,
 *         (requiredVariablesMissing.get(key) || 0) + 1
 *       )
 *       // Alert if seeing spikes in missing variables
 *       if (requiredVariablesMissing.get(key) > 100) {
 *         await alertService.criticalError({
 *           message: `Recurring missing variable: ${error.variableName}`,
 *           template: templateName,
 *           count: requiredVariablesMissing.get(key)
 *         })
 *       }
 *     }
 *     throw error
 *   }
 * }
 * ```
 */
export class RequiredVariableMissingError extends Error {
  constructor(public variableName: string) {
    super(
      `Required variable "${variableName}" is missing and has no fallback`
    )
    this.name = 'RequiredVariableMissingError'
  }
}

/**
 * Thrown when database connection or query fails
 *
 * Indicates an infrastructure-level error preventing template rendering. This includes:
 * - Database connection failures (server unreachable, auth failed)
 * - Query timeouts or execution failures
 * - Connection pool exhaustion
 * - Network connectivity issues
 * - Invalid database credentials
 *
 * This is distinct from data validation errors - it indicates the system cannot
 * access required data, not that the data is invalid.
 *
 * Common Causes:
 * - Database server down or restarting
 * - Network latency or packet loss
 * - Invalid POSTCRAFT_DATABASE_URL connection string
 * - Credentials expired or invalid
 * - Connection pool size exceeded
 * - Query timeout (default 5000ms, configurable)
 * - PostgreSQL authentication or permissions issue
 *
 * Properties:
 * - name: Always 'DatabaseConnectionError'
 * - message: Database connection failed: {details}
 * - details: Underlying error description (public property)
 *
 * How to Fix:
 * 1. Check database server is running and accessible
 * 2. Verify POSTCRAFT_DATABASE_URL is correct
 * 3. Test connection: psql "$POSTCRAFT_DATABASE_URL"
 * 4. Check database credentials and permissions
 * 5. Verify network connectivity to database server
 * 6. Review database logs for errors
 * 7. Increase timeout if network is slow: new PostCraft({ timeout: 15000 })
 *
 * Production Handling:
 * - Implement retry logic with exponential backoff
 * - Use circuit breaker pattern to prevent cascading failures
 * - Log database errors for monitoring and alerts
 * - Provide fallback email delivery (queue, retry later)
 * - Alert operations team if persistent
 *
 * @class DatabaseConnectionError
 * @extends Error
 *
 * @param {string} details - Underlying error description from database driver
 *
 * @example
 * ```typescript
 * import { PostCraft, DatabaseConnectionError } from 'postcraft'
 *
 * const postcraft = new PostCraft()
 *
 * try {
 *   const html = await postcraft.templates.render('welcome-email', {
 *     USER_NAME: 'John Doe'
 *   })
 * } catch (error) {
 *   if (error instanceof DatabaseConnectionError) {
 *     console.error('Database connection failed:', error.details)
 *     // Check database server health
 *     // Implement retry logic or fallback
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Retry logic with exponential backoff
 * async function renderWithRetry(
 *   templateName,
 *   variables,
 *   maxRetries = 3,
 *   baseDelay = 1000
 * ) {
 *   let lastError
 *
 *   for (let attempt = 0; attempt < maxRetries; attempt++) {
 *     try {
 *       return await postcraft.templates.render(templateName, variables)
 *     } catch (error) {
 *       if (error instanceof DatabaseConnectionError) {
 *         lastError = error
 *         const delay = baseDelay * Math.pow(2, attempt)
 *         console.warn(
 *           `Database connection failed (attempt ${attempt + 1}/${maxRetries}), ` +
 *           `retrying in ${delay}ms: ${error.details}`
 *         )
 *         await new Promise(resolve => setTimeout(resolve, delay))
 *       } else {
 *         throw error  // Not a connection error, fail immediately
 *       }
 *     }
 *   }
 *
 *   throw lastError
 * }
 *
 * // Usage
 * try {
 *   const html = await renderWithRetry('order-confirmation', {
 *     ORDER_ID: '12345'
 *   })
 * } catch (error) {
 *   console.error('Failed to render after retries:', error)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Circuit breaker pattern
 * class DatabaseCircuitBreaker {
 *   private failureCount = 0
 *   private lastFailureTime = 0
 *   private readonly failureThreshold = 5
 *   private readonly resetTimeout = 30000  // 30 seconds
 *
 *   async render(templateName, variables) {
 *     // Check if circuit is open
 *     if (this.failureCount >= this.failureThreshold) {
 *       const timeSinceFailure = Date.now() - this.lastFailureTime
 *       if (timeSinceFailure < this.resetTimeout) {
 *         throw new Error(
 *           'Database circuit open - too many failures'
 *         )
 *       } else {
 *         this.failureCount = 0  // Reset circuit
 *       }
 *     }
 *
 *     try {
 *       return await postcraft.templates.render(templateName, variables)
 *     } catch (error) {
 *       if (error instanceof DatabaseConnectionError) {
 *         this.failureCount++
 *         this.lastFailureTime = Date.now()
 *         // Alert monitoring
 *         await monitoringService.alert({
 *           level: 'error',
 *           message: `Database connection failed: ${error.details}`,
 *           failureCount: this.failureCount
 *         })
 *       }
 *       throw error
 *     }
 *   }
 * }
 *
 * const breaker = new DatabaseCircuitBreaker()
 *
 * try {
 *   const html = await breaker.render('template', { VAR: 'value' })
 * } catch (error) {
 *   if (error.message.includes('circuit open')) {
 *     // Database has too many failures, use fallback
 *     console.log('Using fallback email due to database issues')
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Connection string validation at startup
 * async function initializePostCraft() {
 *   try {
 *     const postcraft = new PostCraft()
 *     console.log('PostCraft SDK initialized successfully')
 *     return postcraft
 *   } catch (error) {
 *     if (error instanceof DatabaseConnectionError) {
 *       console.error(
 *         'Failed to initialize PostCraft - database not accessible:',
 *         error.details
 *       )
 *       console.error('Checked POSTCRAFT_DATABASE_URL:', process.env.POSTCRAFT_DATABASE_URL)
 *       process.exit(1)
 *     }
 *     throw error
 *   }
 * }
 *
 * const postcraft = await initializePostCraft()
 * ```
 */
export class DatabaseConnectionError extends Error {
  constructor(public details: string) {
    super(`Database connection failed: ${details}`)
    this.name = 'DatabaseConnectionError'
  }
}
