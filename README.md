# PostCraft

**Email Studio for Developers** #

UI Kit: TailwindCSS + shadcn components

## Features

- **Local studio dashboard** — Install the package and launch localhost:3579 to mange templates, set props, and copy the import snippet for use in your codebase.
- **react-email-editor** — visual drag-and-drop email builder to build templates.
- **Campaigns** — Create/schedule broadcasts, basic segmentation, A/B subject tests, unsub handling, and simple analytics.
- **Pluggable ESPs** — AWS SES supported. Roadmap: Extend beyond SES (Mailgun, Postmark, etc.) via adapters.
- **Self-host** — Run it inside your stack for privacy/compliance.
- **AI Assistant** — Generate subject lines, copy, layouts, and multi-step campaigns; refactor tone and length.

## MVP Roadmap

- [✓] **Local studio dashboard**
- [✓] **react-email-editor**
- [✓] **SDK with template rendering**
- [ ] **Campaigns**
- [ ] **Pluggable ESPs**
- [ ] **Self-host**
- [ ] **AI Assistant**

## Setup

### 1. Installation

```bash
npm install postcraft
```

### 2. Environment Configuration

Create a `.env` file in your project root:

```bash
# .env
POSTCRAFT_DATABASE_URL=postgresql://user:password@localhost:5432/postcraft
```

**Getting your database URL:**
- **Local Development**: Run PostgreSQL locally and create a database, then use the connection string
- **Production**: Use a managed PostgreSQL service like Neon, Railway, or AWS RDS

### 3. Start the PostCraft Studio

In your project directory, you can start the PostCraft Studio in two ways:

**Option 1: Using npx (quickest)**
```bash
npx postcraft
```

**Option 2: Add to your package.json scripts**

Add this to your `package.json`:
```json
{
  "scripts": {
    "postcraft": "postcraft"
  }
}
```

Then run:
```bash
npm run postcraft
```

Visit [localhost:3579](http://localhost:3579) to:
- Create and edit email templates visually
- Define variables and their types
- Set fallback values for optional variables
- Preview rendered templates

## Usage Example in Your Codebase

```typescript
import { PostCraft } from 'postcraft'

const postcraft = new PostCraft()

// Render template with variables
const html = await postcraft.templates.render('welcome-email', {
  NAME: 'John Doe',
  VERIFICATION_URL: 'https://example.com/verify/abc123'
})

// Send via your email service
await emailService.send({
  to: 'john@example.com',
  subject: 'Welcome to Our Service!',
  html: html
})
```

### With Fallback Values

If your template has optional variables with fallback values defined in the studio, you don't need to provide them:

```typescript
// Template 'newsletter' has ISSUE_NUMBER with fallback "Latest"
const html = await postcraft.templates.render('newsletter', {
  RECIPIENT_NAME: 'Alice Smith'
  // ISSUE_NUMBER will use fallback value "Latest"
})
```

## Error Handling

Handle errors gracefully in your application:

```typescript
import {
  PostCraft,
  TemplateNotFoundError,
  RequiredVariableMissingError,
  TemplateVariableTypeError,
  DatabaseConnectionError
} from 'postcraft'

const postcraft = new PostCraft()

try {
  const html = await postcraft.templates.render('order-confirmation', {
    ORDER_ID: 'ORD-12345',
    CUSTOMER_NAME: 'Bob Smith',
    TOTAL_AMOUNT: 99.99
  })

  await emailService.send({
    to: 'bob@example.com',
    html: html
  })
} catch (error) {
  if (error instanceof TemplateNotFoundError) {
    console.error(`Template not found: ${error.templateName}`)
    // Check that template exists in studio at localhost:3579
  } else if (error instanceof RequiredVariableMissingError) {
    console.error(`Missing required variable: ${error.variableName}`)
    // Verify all required variables are provided to render()
  } else if (error instanceof TemplateVariableTypeError) {
    console.error(
      `Type error: ${error.variableName} should be ${error.expectedType}, ` +
      `got ${error.providedType}`
    )
    // Convert variable to correct type before rendering
  } else if (error instanceof DatabaseConnectionError) {
    console.error(`Database connection failed: ${error.details}`)
    // Implement retry logic or use fallback email
  }
}
```

### Production Error Handling Pattern

```typescript
async function renderTemplateWithRetry(
  templateName: string,
  variables: Record<string, any>,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await postcraft.templates.render(templateName, variables)
    } catch (error) {
      // Retry on database errors
      if (error instanceof DatabaseConnectionError) {
        lastError = error
        const delay = 1000 * Math.pow(2, attempt) // exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Fail immediately on data/validation errors
      if (
        error instanceof TemplateNotFoundError ||
        error instanceof RequiredVariableMissingError ||
        error instanceof TemplateVariableTypeError
      ) {
        throw error
      }

      throw error
    }
  }

  throw lastError || new Error('Failed to render template after retries')
}
```

## Configuration Options

### Advanced Configuration

```typescript
import { PostCraft } from 'postcraft'

const postcraft = new PostCraft({
  // Override database URL (useful for testing)
  databaseUrl: process.env.POSTCRAFT_DATABASE_URL,

  // Query timeout in milliseconds (default: 5000)
  timeout: 10000,

  // Cache templates in memory for this duration in seconds (default: 0 = no caching)
  cacheTtl: 300  // Cache for 5 minutes
})
```

### Multiple SDK Instances

```typescript
// Production instance
const productionPostcraft = new PostCraft({
  databaseUrl: process.env.PRODUCTION_DATABASE_URL,
  timeout: 15000,
  cacheTtl: 600
})

// Testing instance
const testingPostcraft = new PostCraft({
  databaseUrl: process.env.TESTING_DATABASE_URL,
  timeout: 5000
})
```