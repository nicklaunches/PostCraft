# PostCraft Constitution

<!--
SYNC IMPACT REPORT:
Version Change: NONE → 1.0.0 (Initial Constitution)
Modified Principles: N/A (New document)
Added Sections:
  - Core Principles (I-VII)
  - Quality Standards
  - Development Workflow
  - Governance
Removed Sections: N/A
Templates Requiring Updates:
  ✅ .specify/templates/spec-template.md - References Principle IV for UX (already aligned)
  ✅ .specify/templates/plan-template.md - Constitution Check section present
  ✅ .specify/templates/tasks-template.md - Test-first workflow aligned
Follow-up TODOs: None
-->

## Core Principles

### I. Type Safety First

All code MUST use TypeScript with strict mode enabled. Database operations MUST use Drizzle ORM for compile-time type safety. No `any` types allowed except when interfacing with untyped third-party libraries, which MUST be wrapped in typed adapters. All API contracts MUST have TypeScript interfaces defining request/response shapes.

**Rationale**: Type safety prevents entire classes of runtime errors, improves refactoring confidence, and serves as living documentation. Drizzle ORM ensures database queries are type-checked at compile time, catching schema mismatches before deployment.

### II. shadcn/ui Component Consistency (NON-NEGOTIABLE)

All user interface elements MUST use shadcn/ui components exclusively. No custom component alternatives are permitted. If a required UI pattern lacks a shadcn/ui component, implementation MUST pause and request user guidance before proceeding. TailwindCSS utility classes MUST be used for all styling following utility-first design patterns.

**Rationale**: Strict adherence to shadcn/ui ensures visual consistency, accessibility compliance (WCAG 2.1 AA), and reduces maintenance burden. Mixed component systems fragment user experience and increase cognitive load for developers.

### III. Test-Driven Development

All new features MUST follow TDD workflow: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. Contract tests required for all API endpoints. Integration tests required for critical user journeys. Unit tests required for business logic with complex branching.

**Rationale**: TDD ensures requirements are testable before implementation, prevents regression, and produces modular, testable code architecture. Untested code creates technical debt and deployment risk.

### IV. UX State Completeness

Every user-facing feature MUST implement all four UI states: loading, success, error, and empty. Loading states MUST appear within 100ms of user action. Error messages MUST be actionable with clear remediation steps. Empty states MUST provide clear calls-to-action. All interactions MUST support keyboard navigation without mouse dependency.

**Rationale**: Incomplete UI states create poor user experience and support burden. Users abandon features that appear broken during loading or provide cryptic errors. Keyboard accessibility is required for WCAG 2.1 AA compliance and power-user efficiency.

### V. Database Schema as Code

All database schema MUST be defined in Drizzle schema files with proper TypeScript types. Migrations MUST be generated automatically via Drizzle Kit. Schema changes MUST be versioned and reversible. Foreign key constraints MUST be defined for all entity relationships. Indexes MUST be documented with query patterns they optimize.

**Rationale**: Schema-as-code ensures consistency between application types and database reality. Manual SQL migrations drift from application code over time. Missing constraints cause data integrity violations that corrupt user data.

### VI. Performance Budgets

Dashboard initial load MUST complete within 2 seconds on 3G connections. Template list with 100+ items MUST render in under 1 second. API responses MUST have p95 latency under 200ms. Database queries MUST use appropriate indexes with EXPLAIN analysis for N+1 prevention. Pagination MUST be used for collections exceeding 20 items.

**Rationale**: Performance directly impacts user satisfaction and retention. Slow interfaces feel broken even when functional. Unoptimized queries degrade as data grows, creating production incidents.

### VII. Security by Default

Local studio server MUST bind exclusively to 127.0.0.1 (localhost), refusing external network connections. Database connection strings MUST be loaded from environment variables, never committed to source control. All user inputs MUST be sanitized before database operations. SQL injection MUST be prevented through Drizzle ORM parameterized queries, not string concatenation.

**Rationale**: Security vulnerabilities in developer tools expose entire development environments and production credentials. Local-only binding prevents accidental exposure on public networks. Environment-based secrets prevent credential leaks in version control.

## Quality Standards

### Code Quality

- **Linting**: ESLint with strict TypeScript rules enforced in CI/CD
- **Formatting**: Prettier with project-wide config; formatting violations block commits
- **Complexity**: Cyclomatic complexity limit of 10 per function; violations require refactoring justification
- **Dependencies**: Regular security audits via `npm audit`; critical vulnerabilities block deployment

### Testing Coverage

- **Contract Tests**: All API endpoints MUST have contract tests verifying request/response schemas
- **Integration Tests**: All critical user journeys (P1 user stories) MUST have end-to-end integration tests
- **Unit Tests**: Business logic with branching complexity >5 MUST have unit test coverage
- **Test Data**: Tests MUST use isolated test databases; production data MUST NOT be used in tests

### Documentation

- **API Contracts**: All endpoints documented in `contracts/` directory with TypeScript interfaces
- **Data Models**: Entity relationships documented in `data-model.md` with diagrams
- **Quickstart**: `quickstart.md` MUST be updated for every user-facing feature change
- **Comments**: Complex business logic MUST have explanatory comments; self-documenting code preferred otherwise

## Development Workflow

### Feature Development

1. **Specification**: Create feature spec in `specs/###-feature-name/spec.md` with user stories
2. **Clarification**: Run `/speckit.clarify` to resolve ambiguities before planning
3. **Planning**: Run `/speckit.plan` to generate implementation plan with constitution check
4. **Task Generation**: Run `/speckit.tasks` to create dependency-ordered task list
5. **Implementation**: Execute tasks following TDD workflow per Principle III
6. **Validation**: Verify all four UI states (Principle IV) before marking complete

### Code Review Requirements

- All PRs MUST pass automated linting, type-checking, and test suites before review
- Reviewers MUST verify compliance with all applicable constitution principles
- Performance-impacting changes MUST include benchmark results against budgets (Principle VI)
- Database schema changes MUST include migration scripts and rollback procedures (Principle V)

### Quality Gates

- **Pre-commit**: Linting and formatting checks via git hooks
- **CI/CD**: Type-checking, test suite execution, build verification
- **Pre-deployment**: Manual QA verification of all four UI states for new features
- **Post-deployment**: Monitoring alerts for performance budget violations

## Governance

This constitution supersedes all other development practices and coding conventions. When conflicts arise between this constitution and individual preferences or external guidelines, the constitution takes precedence.

### Amendment Process

1. **Proposal**: Document proposed change with justification and impact analysis
2. **Review**: All team members review and provide feedback
3. **Migration**: Create migration plan for existing code violating new principles
4. **Approval**: Requires consensus; contentious changes require 2-week discussion period
5. **Documentation**: Update constitution version, templates, and dependent artifacts

### Versioning Policy

Constitution follows semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Backward-incompatible governance changes or principle removals
- **MINOR**: New principles added or existing principles materially expanded
- **PATCH**: Clarifications, wording improvements, or non-semantic refinements

### Compliance Review

- All PRs MUST include constitution compliance checklist in description
- Monthly audits identify code violating constitution principles
- Violations MUST be remediated or documented with exception justification
- Repeated violations trigger architecture review and refactoring sprint

### Exception Handling

Exceptions to constitution principles MUST be:
1. Documented in implementation plan's "Complexity Tracking" section
2. Justified with specific technical or business constraints
3. Include explanation of why simpler constitutional approach was insufficient
4. Time-bound with remediation plan if temporary exception

**Version**: 1.0.0 | **Ratified**: 2025-10-18 | **Last Amended**: 2025-10-18
