<!--
Sync Impact Report - Constitution Update
============================================
Version: 0.0.0 → 1.0.0
Date: 2025-10-18

Change Type: MAJOR - Initial constitution ratification

Principles Established:
- Component-First Architecture
- Type Safety & Contract Validation
- Test Coverage Standards (NON-NEGOTIABLE)
- User Experience Consistency
- Performance-First Development
- Provider Abstraction Pattern

Sections Added:
- Core Principles (6 principles)
- Technology Standards
- Quality Gates
- Governance

Templates Status:
✅ plan-template.md - Aligned with constitution checks
✅ spec-template.md - User scenarios align with UX consistency
✅ tasks-template.md - Test-first approach enforced

Follow-up Actions: None
-->

# PostCraft Constitution

**Component Email Studio for Developers**

This constitution defines the non-negotiable principles and standards that guide all technical decisions and implementation choices in the PostCraft project.

## Core Principles

### I. Component-First Architecture

**Principle**: Every feature MUST be built as composable, reusable components with clear boundaries and single responsibilities.

**Requirements**:
- React components MUST follow single responsibility principle
- Components MUST be independently testable in isolation
- Shared UI components MUST use shadcn/ui patterns and conventions
- Email templates MUST be composed from reusable blocks
- API endpoints MUST be modular and independently deployable
- No direct coupling between unrelated feature domains

**Rationale**: Component-first design enables rapid feature development, easier testing, and maintainable code. This aligns with React's philosophy and shadcn/ui's composable approach while ensuring PostCraft remains extensible as a platform.

### II. Type Safety & Contract Validation

**Principle**: All interfaces between components, APIs, and external services MUST be type-safe and validated at runtime.

**Requirements**:
- TypeScript MUST be used for all application code with strict mode enabled
- Zero `any` types in production code (use `unknown` with guards if needed)
- API contracts MUST define request/response schemas Zod
- Email template props MUST be validated with schemas
- ESP adapter interfaces MUST enforce type contracts
- AI assistant prompts/responses MUST have defined input/output types

**Rationale**: Type safety catches errors at compile time, provides better IDE support, and serves as living documentation. Runtime validation ensures data integrity from external sources (APIs, user input, ESP responses).

### III. Test Coverage Standards (NON-NEGOTIABLE)

**Principle**: Test-driven development is mandatory. Tests MUST be written first, verified to fail, then implementation proceeds.

**Requirements**:
- **Unit Tests**: All services, utilities, and pure functions MUST have ≥90% coverage
- **Component Tests**: All React components MUST have tests for user interactions and state changes
- **Integration Tests**: All API endpoints and ESP adapters MUST have integration tests
- **E2E Tests**: Critical user journeys (template creation, email sending, campaign management) MUST have E2E tests
- Tests MUST be written BEFORE implementation (Red-Green-Refactor)
- Test files MUST be co-located with source files or in parallel test directory
- Mock external services (AWS SES, AI APIs) in unit/integration tests

**Test Framework Standards**:
- Jest or Vitest for unit/integration tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

**Rationale**: TDD ensures correctness, prevents regressions, and improves design. PostCraft handles email delivery and campaign management—bugs can directly impact user communication, making comprehensive testing critical.

### IV. User Experience Consistency

**Principle**: All user interfaces MUST provide consistent, intuitive, and accessible experiences across all features.

**Requirements**:
- Follow shadcn/ui component patterns and styling conventions
- Maintain consistent spacing, typography, and color usage (TailwindCSS utilities)
- All interactive elements MUST have clear hover/focus/active states
- Forms MUST provide real-time validation feedback
- Loading states MUST be clearly indicated (skeletons, spinners)
- Error messages MUST be user-friendly and actionable
- Keyboard navigation MUST work for all interactive elements
- WCAG 2.1 Level AA accessibility compliance required
- Email previews MUST accurately represent final output across major clients (Gmail, Outlook, Apple Mail)

**Rationale**: PostCraft is a developer tool that must be intuitive for technical users. Consistency reduces cognitive load, improves productivity, and ensures professional quality.

### V. Performance-First Development

**Principle**: Performance is a feature. All code MUST meet defined performance standards before merging.

**Requirements**:
- **Frontend Performance**:
  - Initial page load: <2s (Lighthouse Performance score ≥90)
  - Time to Interactive: <3s
  - First Contentful Paint: <1.5s
  - React component rendering: No unnecessary re-renders (use profiler to verify)
  - Email editor: Drag-drop operations <100ms response
- **Backend Performance**:
  - API response time: p95 <500ms, p99 <1s
  - Email sending via SES: <2s per email
  - Database queries: <100ms for reads, <500ms for complex queries
  - Batch operations: Support pagination for large datasets
- **Build Performance**:
  - Production build time: <5 minutes
  - Development HMR: <1s for most changes
- Code splitting MUST be used for large dependencies
- Images MUST be optimized (Next.js Image component)
- API responses MUST be cached where appropriate

**Rationale**: PostCraft must handle email operations at scale. Slow tools frustrate users. Performance targets ensure the platform remains responsive even with large template libraries and campaign histories.

### VI. Provider Abstraction Pattern

**Principle**: All external service integrations MUST use adapter patterns to enable swappable implementations without affecting core functionality.

**Requirements**:
- ESP integrations (SES, Mailgun, Postmark) MUST implement a common `EmailProvider` interface
- AI service integrations MUST implement a common `AIProvider` interface
- Storage backends MUST implement a common `StorageProvider` interface
- Authentication providers MUST implement a common `AuthProvider` interface
- Each adapter MUST be independently testable with mocks
- Configuration MUST allow runtime provider selection via environment variables
- Adapters MUST handle provider-specific errors and normalize to standard error types

**Example Structure**:
```typescript
interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>
  validateConnection(): Promise<boolean>
  getDeliveryStatus(id: string): Promise<DeliveryStatus>
}
```

**Rationale**: PostCraft's roadmap includes supporting multiple ESPs and AI providers. The adapter pattern ensures users can switch providers without code changes and enables future extensibility.

## Technology Standards

### Core Stack (Non-Negotiable)
- **Framework**: Next.js (latest stable) with App Router
- **Language**: TypeScript 5.x with strict mode
- **UI Library**: React 18+ with shadcn/ui components
- **Styling**: TailwindCSS 3.x
- **Email Builder**: react-email-editor (or React Email components where applicable)
- **Primary ESP**: AWS SES SDK v3
- **Package Manager**: pnpm (for workspace management)

### Required Dependencies
- **Validation**: Zod for schema validation
- **ORM**: Drizzle ORM
- **Testing**: Jest/Vitest, React Testing Library, Playwright
- **Linting**: ESLint with Next.js config + Prettier
- **Git Hooks**: Husky + lint-staged for pre-commit checks

### Database
- PostgreSQL for production (relational data, campaigns, analytics)
- SQLite for local development (optional)

### AI Integration
- Provider-agnostic with adapters for OpenAI, Anthropic, etc.
- Users bring their own API keys
- Streaming responses for real-time generation

## Quality Gates

All feature work MUST pass these gates before merging to main:

### 1. Constitution Check
- [ ] Follows component-first architecture
- [ ] All interfaces are type-safe with runtime validation
- [ ] Tests written first and achieve coverage requirements
- [ ] UI follows shadcn/ui patterns and accessibility standards
- [ ] Performance benchmarks met
- [ ] External services use provider abstraction pattern

### 2. Code Quality
- [ ] TypeScript strict mode with no `any` types
- [ ] ESLint passes with zero warnings
- [ ] Prettier formatting applied
- [ ] No console.log statements in production code (use proper logging)
- [ ] All functions have clear, descriptive names
- [ ] Complex logic includes explanatory comments

### 3. Testing Gate
- [ ] All tests pass (unit, integration, E2E)
- [ ] Code coverage ≥90% for new code
- [ ] Tests include happy paths and edge cases
- [ ] External services properly mocked
- [ ] E2E tests cover critical user flows

### 4. Performance Gate
- [ ] Lighthouse Performance score ≥90 (frontend)
- [ ] API endpoints meet p95 <500ms target
- [ ] No blocking render operations
- [ ] Bundle size analyzed (no unexpected increases)

### 5. Documentation Gate
- [ ] Public APIs/components have JSDoc comments
- [ ] README updated if new features/setup required
- [ ] User-facing features have quickstart documentation
- [ ] Breaking changes documented in CHANGELOG

### 6. Security Gate
- [ ] No hardcoded secrets or API keys
- [ ] Environment variables properly configured
- [ ] User input validated and sanitized
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React's built-in escaping + CSP headers)
- [ ] Rate limiting on public endpoints

## Governance

### Authority & Compliance

This constitution **supersedes all other development practices**. When conflicts arise between this constitution and other guidance, the constitution takes precedence.

**All technical decisions MUST:**
1. Align with at least one core principle
2. Pass all quality gates before merging
3. Be justified if adding complexity beyond principle requirements

**When principles conflict:**
- Prioritize: Security > Performance > UX Consistency > Architecture Cleanliness
- Document trade-offs explicitly in implementation plan

### Amendment Process

**Who Can Propose**: Any project contributor
**Approval Required**: Project maintainers or technical lead

**Amendment Categories**:
- **MAJOR** (X.0.0): Changes principle definitions, removes principles, or introduces backward-incompatible governance
- **MINOR** (0.X.0): Adds new principles, expands requirements materially, or adds new quality gates
- **PATCH** (0.0.X): Clarifications, typo fixes, non-semantic improvements, example updates

**Amendment Steps**:
1. Propose change via RFC document explaining rationale
2. Identify impact on existing codebase and templates
3. Gain approval from maintainers
4. Update constitution with new version number
5. Update all affected templates and documentation
6. Communicate changes to all contributors
7. Create migration plan if changes require code updates

### Versioning Policy

Constitution follows semantic versioning. Current version is documented in the footer of this file.

**Version History:**
- 1.0.0 (2025-10-18): Initial ratification with 6 core principles

### Review Cadence

- **Quarterly Review**: Assess if principles still serve project needs
- **Post-Mortem Review**: After major incidents, review if constitution would have prevented the issue
- **Onboarding**: All new contributors must read and acknowledge this constitution

### Enforcement

- Pre-commit hooks verify linting and type-checking
- CI/CD pipeline enforces test coverage and quality gates
- Code reviews MUST explicitly verify constitution compliance
- Complexity violations MUST be justified in PR description with reference to specific principle trade-offs

### Guidance Files

For runtime development assistance and detailed implementation patterns, refer to:
- `.specify/templates/plan-template.md` - Feature planning workflow
- `.specify/templates/spec-template.md` - Feature specification structure
- `.specify/templates/tasks-template.md` - Task breakdown and execution order

---

**Version**: 1.0.0 | **Ratified**: 2025-10-18 | **Last Amended**: 2025-10-18
