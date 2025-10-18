# Feature Specification: Local Studio Dashboard

**Feature Branch**: `001-local-studio-dashboard`
**Created**: October 18, 2025
**Status**: Draft
**Input**: User description: "Develop drop-in local studio with dashboard, templates management, react-email-editor integration, and export capabilities"

## Scope

### In Scope
- Local studio dashboard accessible at localhost:3579
- Template management via visual interface (create, read, update, delete)
- Visual email editor integration (react-email-editor)
- Template export primarily as HTML for copying and integration
- Template variable management with type definitions and fallback values using merge tags
- Programmatic SDK for template rendering (PostCraft API similar to Resend)
- shadcn/ui components and TailwindCSS design patterns throughout the interface

### Out of Scope
- Template import functionality (deferred to future version)
- Programmatic template creation via SDK API (deferred - only UI creation in this version)
- Complex React component exports with component libraries (keeping export simple for now)
- JSON and plain text export formats (focusing on HTML export initially)
- Multi-user collaboration or real-time editing
- Template versioning or revision history
- Email sending/delivery functionality (SDK focuses on rendering only)
- Template preview in multiple email clients
- Template marketplace or sharing features
- Authentication or user management
- Cloud storage or synchronization

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently

  UX CONSISTENCY REQUIREMENTS (per Constitution Principle IV):
  - All stories must follow shadcn/ui component patterns
  - Include loading states, error states, and empty states
  - Ensure keyboard navigation and WCAG 2.1 AA accessibility
  - Provide real-time validation feedback for forms
  - Maintain consistent spacing, typography, and colors
-->

### User Story 1 - Dashboard Access and Navigation (Priority: P1)

As a developer, I want to access the PostCraft local studio by navigating to localhost:3579 so that I can manage my email templates in a visual interface.

**Why this priority**: This is the entry point to the entire studio - without a working dashboard, no other features can be accessed or used. This establishes the foundation for all subsequent functionality.

**Independent Test**: Can be fully tested by starting the local server and verifying that localhost:3579 loads a functional dashboard with navigation, and delivers immediate value by providing visibility into the studio's capabilities.

**Acceptance Scenarios**:

1. **Given** the PostCraft package is installed, **When** I run `npm run studio` or `yarn studio`, **Then** the local studio server starts and the dashboard loads at localhost:3579 with shadcn/ui sidebar-07 layout (collapsible sidebar with icons)
2. **Given** I'm on the dashboard, **When** I look at the navigation, **Then** I see a collapsible sidebar with clear icons and labels to access Templates and other sections
3. **Given** the dashboard is loading, **When** the page is rendering, **Then** I see a loading state with appropriate feedback
4. **Given** the server fails to start, **When** an error occurs, **Then** I see a clear error message with troubleshooting steps
5. **Given** I'm navigating the dashboard, **When** I use keyboard shortcuts, **Then** all navigation is accessible via keyboard only

---

### User Story 2 - View and List Email Templates (Priority: P1)

As a developer, I want to view a list of all my email templates on the /templates page so that I can see what templates exist and select one to work with.

**Why this priority**: Viewing existing templates is essential for any template management workflow. This provides immediate value by showing users their current templates and enables them to decide what action to take next.

**Independent Test**: Can be fully tested by navigating to /templates and verifying that the template list displays correctly with all templates, empty states, and delivers value by showing the current state of email templates.

**Acceptance Scenarios**:

1. **Given** I have existing email templates, **When** I navigate to /templates, **Then** I see a list of all templates with names and preview information
2. **Given** I have no templates yet, **When** I navigate to /templates, **Then** I see an empty state with a clear call-to-action to create my first template
3. **Given** I'm viewing the template list, **When** templates are loading, **Then** I see skeleton loaders indicating the page is loading
4. **Given** I'm viewing the template list, **When** I hover over a template card, **Then** I see quick action buttons (edit, delete, export)
5. **Given** templates fail to load, **When** an error occurs, **Then** I see an error state with a retry option
6. **Given** I have more than 20 templates, **When** I view the template list, **Then** I see pagination controls with page numbers and can navigate between pages
7. **Given** I'm on a paginated template list, **When** I click "Next" or a page number, **Then** the next page of templates loads without full page refresh
8. **Given** I'm viewing templates, **When** I use keyboard navigation, **Then** I can navigate through template cards using arrow keys

---

### User Story 3 - Create New Email Template (Priority: P2)

As a developer, I want to create a new email template with a visual editor so that I can design email layouts without writing HTML manually.

**Why this priority**: Creating templates is the core value proposition of PostCraft. While viewing templates is important, the ability to create new templates is what makes the tool truly useful.

**Independent Test**: Can be fully tested by clicking "Create Template", using the react-email-editor to design an email, saving it, and verifying it appears in the template list with all expected metadata.

**Acceptance Scenarios**:

1. **Given** I'm on the /templates page, **When** I click "Create New Template", **Then** I'm taken to a template creation page with the react-email-editor loaded
2. **Given** I'm creating a template, **When** I design the email layout using drag-and-drop components, **Then** the editor updates in real-time
3. **Given** I'm creating a template, **When** I provide a template name and save, **Then** the template is saved and I'm redirected to the template list
4. **Given** I'm creating a template, **When** I try to save without a name, **Then** I see validation feedback requiring a template name
5. **Given** I'm creating a template, **When** the save operation fails, **Then** I see an error message with retry button and my work remains in the editor (preserved in memory)
6. **Given** I'm creating a template, **When** I press Escape or click "Cancel", **Then** I see a confirmation dialog if I have unsaved changes
7. **Given** the editor is loading, **When** the page renders, **Then** I see a loading state until the react-email-editor is ready

---

### User Story 4 - Edit Existing Email Template (Priority: P2)

As a developer, I want to edit an existing email template so that I can update and improve my email designs over time.

**Why this priority**: Template editing is equally important to creation - templates need to evolve based on feedback and changing requirements. This completes the core CRUD operations for templates.

**Independent Test**: Can be fully tested by selecting an existing template, modifying it in the editor, saving changes, and verifying the updates are reflected in the template list.

**Acceptance Scenarios**:

1. **Given** I'm viewing a template in the list, **When** I click "Edit" on a template, **Then** the template opens in the react-email-editor with its current content loaded
2. **Given** I'm editing a template, **When** I make changes to the design, **Then** the editor reflects my changes in real-time
3. **Given** I'm editing a template, **When** I save my changes, **Then** the updated template is saved and I see a success confirmation
4. **Given** I'm editing a template, **When** I navigate away without saving, **Then** I see a warning about unsaved changes
5. **Given** a template is loading in the editor, **When** the page renders, **Then** I see a loading state until the content is ready
6. **Given** I'm editing a template, **When** the save fails, **Then** I see a clear error message with retry button and my changes remain in the editor (preserved in memory)
7. **Given** I'm editing a template in one tab, **When** I try to open the same template in another tab, **Then** the second tab shows read-only mode with a notification
8. **Given** I'm editing a template, **When** I use keyboard shortcuts, **Then** common actions (save, undo, redo) are accessible via keyboard

---

### User Story 5 - Delete Email Template (Priority: P2)

As a developer, I want to delete email templates I no longer need so that I can keep my template library organized and relevant.

**Why this priority**: Deletion is part of complete template management and helps users maintain a clean workspace. While less critical than create/read/update, it's still essential for long-term template maintenance.

**Independent Test**: Can be fully tested by selecting a template, triggering delete, confirming the action, and verifying the template is removed from the list with proper confirmation feedback.

**Acceptance Scenarios**:

1. **Given** I'm viewing the template list, **When** I click "Delete" on a template, **Then** I see a confirmation dialog warning me about permanent deletion
2. **Given** I see the delete confirmation dialog, **When** I confirm deletion, **Then** the template is permanently removed and I see a success message
3. **Given** I see the delete confirmation dialog, **When** I cancel, **Then** the template remains intact and the dialog closes
4. **Given** I delete a template, **When** the deletion fails, **Then** I see an error message and the template remains in the list
5. **Given** I'm confirming deletion, **When** I use keyboard navigation, **Then** I can confirm or cancel using keyboard only

---

### User Story 6 - Export Email Template as HTML (Priority: P3)

As a developer, I want to export my email templates as HTML so that I can copy and integrate them into my application codebase.

**Why this priority**: HTML export enables developers to preview and manually integrate templates. This is kept simple for the initial version, with programmatic SDK rendering being the primary integration path.

**Independent Test**: Can be fully tested by selecting a template, exporting as HTML, and verifying the exported HTML is valid with inline styles and proper merge tag preservation.

**Acceptance Scenarios**:

1. **Given** I'm viewing a template, **When** I click "Export as HTML", **Then** I see the HTML export interface
2. **Given** I'm exporting a template, **When** the export completes, **Then** I receive valid HTML with inline styles ready for email clients
3. **Given** the exported HTML contains merge tags, **When** I view the HTML, **Then** merge tag variables are preserved in a format compatible with the SDK
4. **Given** I'm exporting a template, **When** I want to copy instead of download, **Then** I have an option to copy the HTML to clipboard
5. **Given** export is in progress, **When** the system is generating the export, **Then** I see a loading indicator with progress feedback
6. **Given** export fails, **When** an error occurs, **Then** I see a clear error message explaining what went wrong
7. **Given** I export a template with no content, **When** I initiate export, **Then** I see a warning and confirmation prompt

---

### User Story 7 - Template Variables Management (Priority: P3)

As a developer, I want to define and manage template variables (like NAME, AGE) within my email templates so that I can create dynamic, personalized emails.

**Why this priority**: Variables enable dynamic content and personalization, which is essential for production email templates. This adds significant value but depends on having basic template management working first.

**Independent Test**: Can be fully tested by creating a template with variables, defining variable metadata (type, fallback values), and verifying variables are properly recognized and exported with the template.

**Acceptance Scenarios**:

1. **Given** I'm creating/editing a template, **When** I add variables using react-email-editor's merge tag feature, **Then** the system detects and lists all variables
2. **Given** variables are detected, **When** I view the variable panel, **Then** I can define the type (string, number, boolean, date) and fallback value for each variable
3. **Given** I define a variable with a fallback value, **When** I preview the template, **Then** the fallback value is displayed in place of the variable
4. **Given** I have optional variables, **When** I export the template, **Then** the export includes variable metadata and usage documentation
5. **Given** I'm managing variables, **When** I remove a variable from the template, **Then** the variable is removed from the variable list
6. **Given** I have validation errors in variable definitions, **When** I try to save, **Then** I see clear error messages about what needs to be fixed

---

### User Story 8 - Programmatic Template Rendering via SDK (Priority: P2)

As a developer, I want to use the PostCraft SDK to programmatically render templates with variables so that I can integrate email generation into my application code.

**Why this priority**: The SDK is the primary way developers will use templates in production. This bridges the gap between visual template design and programmatic usage, similar to how Resend works.

**Independent Test**: Can be fully tested by importing the PostCraft SDK, calling the render method with a template name and variables, and verifying it returns properly rendered HTML with variables replaced.

**Acceptance Scenarios**:

1. **Given** I have PostCraft installed, **When** I import `PostCraft` from the package, **Then** I can instantiate a new PostCraft client
2. **Given** I have a PostCraft client, **When** I call `postCraft.templates.render('template-name', { NAME: 'John', AGE: 30 })`, **Then** I receive rendered HTML with merge tags replaced by provided values
3. **Given** I render a template with missing variables, **When** variables have fallback values defined, **Then** the fallback values are used for missing variables
4. **Given** I render a template with missing required variables, **When** no fallback is defined, **Then** I receive a clear error indicating which variables are missing
5. **Given** I render a template that doesn't exist, **When** I call render with an invalid template name, **Then** I receive a clear error that the template was not found
6. **Given** templates are stored in PostgreSQL, **When** the SDK renders a template, **Then** it connects to the database to retrieve the template content
7. **Given** the database connection fails, **When** I try to render a template, **Then** I receive a clear error about the connection failure
8. **Given** I render a template with a variable of wrong type, **When** I provide a string for a number-type variable, **Then** I receive a descriptive error specifying the variable name, expected type (number), and provided type (string)
9. **Given** I render a template with correct variable types, **When** all provided values match their defined types, **Then** the template renders successfully without type errors

---

### Edge Cases

- What happens when the user navigates to localhost:3579 but the server isn't running? Display a connection error with instructions to run `npm run studio` or `yarn studio`.
- What happens when port 3579 is already occupied by another service? Auto-detect the next available port (3580, 3581, etc.) and display a notification with the actual port being used.
- What happens when someone tries to access the studio from an external network address? The server refuses the connection since it only binds to 127.0.0.1 (connection will fail/timeout).
- What happens when a template name contains special characters or is very long? Validate and sanitize template names, enforce character limits.
- What happens when the user tries to export a template with no content? Show a warning that the template is empty and ask for confirmation.
- What happens when multiple templates have the same name? Prevent duplicate names with validation or auto-append a number suffix.
- What happens when the react-email-editor fails to load due to network issues? Display an error state with retry option and fallback to raw HTML editing.
- What happens when a user has hundreds of templates? Use offset-based pagination with page numbers, displaying 20 templates per page to maintain performance.
- What happens when a template's JSON structure is corrupted in the database? Detect corruption during load and offer recovery options or safe defaults.
- What happens when the PostgreSQL connection fails or times out? Display clear error message with connection troubleshooting steps and retry option.
- What happens when database migrations are pending or schema is outdated? Detect schema version mismatch and provide migration guidance.
- What happens when the user closes the browser while editing? Display browser-native "unsaved changes" warning via beforeunload event; unsaved work is lost if user confirms exit.
- What happens when the same template is opened in multiple browser tabs? Enforce single-editor lock - first tab gets edit mode, others show read-only with notification.
- What happens when exported React components contain invalid variable names? Sanitize variable names to be valid JavaScript identifiers.
- What happens when a template uses deprecated react-email-editor features? Display migration warnings and provide update guidance.
- What happens when the SDK cannot connect to PostgreSQL? Throw clear error with database connection troubleshooting guidance.
- What happens when SDK and studio point to different databases? Not supported - both must use the same DATABASE_URL environment variable.
- What happens when a template is deleted while SDK is rendering it? SDK render should fail gracefully with "template not found" error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST serve the local studio dashboard on localhost:3579 when started, or auto-detect and use the next available port (3580, 3581, etc.) if 3579 is occupied, notifying the developer of the actual port
- **FR-001a**: System MUST bind exclusively to 127.0.0.1 (localhost) and reject all external network connection attempts for security
- **FR-002**: System MUST display a functional navigation interface following shadcn/ui design patterns
- **FR-002a**: System MUST use shadcn/ui sidebar-07 template as the base dashboard layout (collapsible sidebar with icons)
- **FR-002b**: System MUST install sidebar-07 via `npx shadcn@latest add sidebar-07` command
- **FR-003**: System MUST use shadcn/ui components exclusively for all UI elements throughout the interface
- **FR-004**: System MUST apply TailwindCSS design patterns consistently across all pages and components
- **FR-005**: System MUST provide a /templates route that displays all email templates
- **FR-004**: System MUST display an empty state on /templates when no templates exist
- **FR-005**: System MUST allow users to create new email templates via a "Create New Template" action
- **FR-006**: System MUST integrate react-email-editor for visual template design and editing
- **FR-006a**: System MUST initialize react-email-editor with all features and tools enabled (full unlocked mode with no restrictions)
- **FR-007**: System MUST allow users to edit existing email templates
- **FR-008**: System MUST allow users to delete email templates with confirmation
- **FR-009**: System MUST persist templates in PostgreSQL database between server restarts
- **FR-010**: System MUST export templates as HTML with inline styles ready for email clients
- **FR-011**: System MUST preserve merge tag variables in exported HTML in SDK-compatible format
- **FR-012**: System MUST provide copy-to-clipboard functionality for HTML exports
- **FR-013**: System MUST provide download functionality for HTML exports
- **FR-014**: System MUST provide a PostCraft SDK importable as `import { PostCraft } from 'postcraft'`
- **FR-014a**: SDK MUST support instantiation via `new PostCraft()` constructor
- **FR-014b**: SDK MUST provide `templates.render(name, variables)` method for rendering templates with variable substitution
- **FR-014c**: SDK MUST retrieve templates from PostgreSQL when rendering using the same DATABASE_URL environment variable as the studio
- **FR-014d**: SDK MUST replace merge tag variables with provided values during rendering
- **FR-014e**: SDK MUST use fallback values for missing variables when fallback is defined
- **FR-014f**: SDK MUST throw clear errors when required variables are missing and no fallback exists
- **FR-014g**: SDK MUST throw clear errors when template name is not found in database
- **FR-014h**: SDK MUST validate variable types at runtime against template variable metadata
- **FR-014i**: SDK MUST throw descriptive errors when provided variable values do not match expected types (e.g., string provided for number type)
- **FR-014j**: SDK MUST include variable name, expected type, and provided type in validation error messages
- **FR-015**: System MUST detect template variables using react-email-editor's native merge tag feature
- **FR-016**: System MUST allow users to define variable types (string, number, boolean, date) and fallback values for merge tags
- **FR-017**: System MUST include variable metadata in template exports
- **FR-018**: System MUST validate template names and prevent duplicates
- **FR-019**: System MUST sanitize template names to prevent SQL injection and ensure database compatibility
- **FR-029**: System MUST read all environment variables with POSTCRAFT_ prefix for configuration
- **FR-029a**: System MUST use POSTCRAFT_DATABASE_URL environment variable for PostgreSQL connection string
- **FR-029b**: System MUST use POSTCRAFT_PORT environment variable for preferred server port (default: 3579 if not set)
- **FR-029c**: System MUST support optional POSTCRAFT_SDK_* prefixed variables for SDK-specific configuration
- **FR-029d**: System MUST provide a .env.sample file documenting all supported POSTCRAFT_ environment variables with example values
- **FR-030**: System MUST handle database connection failures gracefully with clear error messages
- **FR-031**: System MUST use Drizzle ORM for all database operations with type-safe queries
- **FR-032**: System MUST use Drizzle Kit to generate and run database migrations automatically
- **FR-033**: System MUST use a two-table database schema: `templates` table and `template_variables` table
- **FR-034**: System MUST define foreign key relationship from template_variables.template_id to templates.id
- **FR-035**: System MUST enforce referential integrity (cascade delete variables when template is deleted)
- **FR-036**: System MUST store template name with unique constraint in templates table
- **FR-037**: System MUST store react-email-editor JSON content in templates.content column
- **FR-038**: System MUST store rendered HTML with merge tags in templates.html column
- **FR-039**: System MUST store variable metadata (key, type as string/number/boolean/date, fallback, is_required) in template_variables table
- **FR-020**: System MUST enforce single-editor lock per template (only one browser tab can edit at a time)
- **FR-021**: System MUST display read-only mode with notification when template is being edited in another tab
- **FR-022**: System MUST display loading states during async operations (loading templates, saving, exporting)
- **FR-023**: System MUST display error states with actionable messages when operations fail
- **FR-023a**: System MUST preserve editor state in memory when save operations fail
- **FR-023b**: System MUST display a retry button with detailed error information for failed saves
- **FR-023c**: System MUST maintain unsaved changes state after failed save attempts until successful save or explicit user navigation
- **FR-024**: System MUST support keyboard navigation for all primary actions
- **FR-025**: System MUST warn users about unsaved changes before navigation
- **FR-025a**: System MUST NOT implement auto-save functionality - all saves are manual and user-initiated
- **FR-025b**: System MUST track unsaved changes state and prevent data loss through warning dialogs only
- **FR-026**: System MUST implement offset-based pagination with page numbers for template lists using LIMIT/OFFSET queries
- **FR-033**: System MUST display pagination controls (previous, next, page numbers) when template count exceeds page size
- **FR-034**: System MUST use a default page size of 20 templates per page for optimal performance
- **FR-027**: System MUST provide visual feedback for all user actions (success, error, loading)
- **FR-028**: System MUST follow WCAG 2.1 AA accessibility standards

### UI/UX Design Requirements

- **UI-001**: System MUST use shadcn/ui components exclusively for all user interface elements
- **UI-001a**: System MUST use shadcn/ui sidebar-07 template as the base dashboard layout structure
- **UI-002**: System MUST use shadcn/ui Button component for all button interactions
- **UI-003**: System MUST use shadcn/ui Card component for template list items and content containers
- **UI-004**: System MUST use shadcn/ui Dialog component for confirmation prompts and modals
- **UI-005**: System MUST use shadcn/ui Input component for all text input fields
- **UI-006**: System MUST use shadcn/ui Select component for dropdown selections (e.g., export format)
- **UI-007**: System MUST use shadcn/ui Skeleton component for loading states
- **UI-008**: System MUST use shadcn/ui Alert component for error and success messages
- **UI-009**: System MUST use shadcn/ui Toast component for transient notifications
- **UI-010**: System MUST use shadcn/ui Tabs component for multi-section navigation if applicable
- **UI-011**: System MUST use shadcn/ui Badge component for status indicators
- **UI-012**: System MUST apply TailwindCSS utility classes following best practices for spacing, typography, and colors
- **UI-013**: System MUST notify developers when a required UI pattern has no corresponding shadcn/ui component and request solution guidance
- **UI-014**: System MUST maintain consistent spacing using TailwindCSS spacing scale (4px base unit)
- **UI-015**: System MUST use shadcn/ui theme variables for colors to support potential theme switching
- **UI-016**: System MUST use shadcn/ui Pagination component for template list page navigation controls

### Key Entities

- **Email Template** (Database Table: `templates`): Represents a designed email with metadata
  - ID: Primary key, auto-generated unique identifier
  - Name: Unique template name for referencing in SDK and UI
  - Content: The email design in react-email-editor JSON format
  - HTML: Rendered HTML version of the template with merge tags
  - Created At: Timestamp of template creation
  - Updated At: Timestamp of last modification

- **Template Variable** (Database Table: `template_variables`): Represents a dynamic placeholder in email templates using react-email-editor merge tags
  - ID: Primary key, auto-generated unique identifier
  - Template ID: Foreign key reference to templates table
  - Key: Merge tag name (e.g., "NAME", "AGE")
  - Type: Data type (string, number, boolean, date)
  - Fallback Value: Default value when merge tag variable is not provided (nullable, stored as string with type-specific formatting)
  - Is Required: Boolean indicating whether the variable is required or optional
  - Created At: Timestamp of variable creation

- **Export Format**: Represents different export output types
  - React Component: JSX/TSX file with proper imports
  - HTML: Standalone HTML with inline styles
  - JSON: react-email-editor structure
  - Plain Text: Text-only content extraction

### Assumptions

- The local studio runs as a standalone server process that developers start via npm/yarn script commands
- Developers run `npm run studio` or `yarn studio` to launch the local studio server
- The server prefers port 3579 but can auto-detect and use alternative ports (3580, 3581, etc.) if occupied
- The server binds exclusively to 127.0.0.1 (localhost) for security, refusing external network connections
- Templates are stored in PostgreSQL database with connection string provided via POSTCRAFT_DATABASE_URL environment variable
- All environment variables use POSTCRAFT_ prefix for clear namespacing (POSTCRAFT_DATABASE_URL, POSTCRAFT_PORT, POSTCRAFT_SDK_*)
- A .env.sample file is provided documenting all supported environment variables with example values
- Drizzle ORM is used for all database operations providing type-safe queries and schema management
- Database migrations are managed by Drizzle Kit and run automatically on server start or via CLI
- Database uses two-table normalized design: `templates` table and `template_variables` table
- Foreign key relationship exists from template_variables.template_id to templates.id with cascade delete
- Template name has unique constraint to prevent duplicates
- Templates table stores: id, name, content (JSON), html, created_at, updated_at
- Template_variables table stores: id, template_id (FK), key, type (string/number/boolean/date), fallback_value, is_required, created_at
- Template lists use offset-based pagination with traditional page numbers (LIMIT/OFFSET queries)
- Default page size is 20 templates per page for optimal load performance
- All UI elements use shadcn/ui components exclusively - no custom component alternatives allowed
- Dashboard layout uses shadcn/ui sidebar-07 template (collapsible sidebar with icons) as the base structure
- Sidebar-07 template is installed via `npx shadcn@latest add sidebar-07` command during setup
- If a required UI pattern lacks a shadcn/ui component, implementation must pause for user guidance
- TailwindCSS is used for all styling following utility-first design patterns
- PostCraft provides both a local studio UI and a programmatic SDK (similar to Resend's architecture)
- Template creation is only via visual editor UI; SDK creation is deferred to future version
- Export functionality focuses on HTML output with download and clipboard copy options
- Complex React component exports are deferred; HTML export is the primary manual integration path
- JSON and plain text exports are deferred to future versions
- Template variables use react-email-editor's native merge tag feature for insertion and management
- SDK template rendering is the primary programmatic integration path for production use
- SDK retrieves templates from the same PostgreSQL database used by the local studio
- Both the local studio and SDK use the same DATABASE_URL environment variable for database connection
- Templates created in the studio are immediately available to the SDK without synchronization
- Authentication is not required for local studio access (runs on localhost for single developer)
- The react-email-editor is the Unlayer Email Editor React component configured with all features and tools enabled (no restrictions)
- Templates are personal to the developer's local environment, not shared across team members

## Clarifications

### Session 2025-10-18

- Q: Template Storage Mechanism - File system storage or SQLite database? → A: File system storage - Each template as a JSON file in a templates directory
- Q: Template Import Capability - Should users be able to import templates from files? → A: No import capability - Export only for initial version
- Q: Server Startup Command - How do developers start the local studio? → A: npm/yarn script - Run via `npm run studio` or `yarn studio` command
- Q: Concurrent Editing Handling - What happens if same template edited in multiple tabs? → A: Single edit lock - Only one tab can edit at a time, others show read-only
- Q: shadcn/ui Component Usage - How strictly should shadcn/ui components be enforced? → A: Strict enforcement - Mandate shadcn/ui for ALL UI elements; if component not found, notify user to provide solution
- Q: Port Conflict Handling Strategy - What happens if port 3579 is already in use? → A: Auto-detect available port - Automatically use next available port (3580, 3581, etc.) and notify user
- Q: Template Directory Location - Where should templates be stored? → A: PostgreSQL - Use PostgreSQL for template storage (supersedes file system approach)
- Q: Database ORM Strategy - Should the system use an ORM or raw SQL for database operations? → A: Drizzle ORM - Use Drizzle ORM for type-safe database operations with auto-migrations
- Q: Network Access Security - Should the server accept connections from external machines or localhost only? → A: Localhost only - Bind to 127.0.0.1, refuse all external network connections for security
- Q: Template List Pagination Strategy - How should template lists be paginated for large datasets? → A: Offset pagination - Traditional page numbers with LIMIT/OFFSET (page 1, 2, 3...)
- Q: How should react-email-editor be configured? → A: Full unlocked mode - All react-email-editor features/tools enabled with no restrictions
- Q: How should template variables integrate with react-email-editor? → A: Native merge tags - Use react-email-editor's built-in merge tag feature for variables
- Q: Is PostCraft both a UI and a programmatic SDK? → A: Yes - PostCraft includes both local studio UI and programmatic SDK (like Resend's approach)
- Q: Can templates be created via SDK API calls? → A: No - Template creation only via visual editor for this version (SDK creation deferred)
- Q: What React component export structure is needed? → A: Keep simple - Focus on HTML export for copying; defer complex React component exports
- Q: How should the database schema be structured for templates? → A: Two tables - Separate templates table and template_variables table with foreign key relationship
- Q: Environment Variable Configuration - What environment variables should be supported? → A: Database connection string, port preference, and optional SDK config (POSTCRAFT_DATABASE_URL, POSTCRAFT_PORT, POSTCRAFT_SDK_*)
- Q: Template Variable Data Types - What data types should template variables support? → A: Support string, number, boolean, and date types
- Q: Auto-save Behavior for Templates - Should templates auto-save while editing? → A: No auto-save - users must manually save all changes (rely on unsaved changes warning only)
- Q: Error Recovery Strategy for Failed Template Saves - How should the system handle failed save operations? → A: Preserve editor state in memory and show retry button with error details
- Q: SDK Type Validation for Template Variables - Should the SDK validate variable types at runtime? → A: Validate types at runtime and throw descriptive errors for mismatches
- Q: Dashboard UI Template - Which shadcn/ui template should be used for the local studio dashboard? → A: sidebar-07 template - Use `npx shadcn@latest add sidebar-07` (collapsible sidebar with icons)
- Q: How does the PostCraft SDK connect to the database? → A: Shared config - SDK uses same PostgreSQL connection string from environment (POSTCRAFT_DATABASE_URL) as studio

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can access the dashboard at localhost:3579 within 2 seconds of starting the server
- **SC-002**: Developers can create a new email template and see it in the template list within 30 seconds
- **SC-003**: The template list loads and displays 100+ templates without noticeable performance degradation (under 1 second)
- **SC-004**: Developers can complete the full workflow (create, edit, export) for a template within 5 minutes on first use
- **SC-005**: All export formats (React, HTML, JSON, plain text) generate valid, usable output 100% of the time
- **SC-006**: Users successfully complete their intended action (create, edit, delete, export) on first attempt 90% of the time
- **SC-007**: All interactive elements are accessible via keyboard navigation with no mouse required
- **SC-008**: Loading states appear within 100ms of user action initiation
- **SC-009**: Error messages provide clear, actionable guidance that resolves the issue without external documentation
- **SC-010**: Template variable detection correctly identifies 100% of merge tags created via react-email-editor's merge tag feature
- **SC-011**: The dashboard maintains consistent shadcn/ui design patterns across all pages and components
- **SC-012**: Unsaved changes are protected via clear warnings before navigation, preventing accidental data loss 100% of the time when warnings are heeded

