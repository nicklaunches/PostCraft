# Feature Specification: Local Studio Dashboard

**Feature Branch**: `001-local-studio-dashboard`
**Created**: October 18, 2025
**Status**: Draft
**Input**: User description: "Develop drop-in local studio with dashboard, templates management, react-email-editor integration, and export capabilities"

## Scope

### In Scope
- Local studio dashboard accessible at localhost:3579
- Template management (create, read, update, delete)
- Visual email editor integration (react-email-editor)
- Template export in multiple formats (React, HTML, JSON, plain text)
- Template variable management with type definitions and fallback values
- shadcn/ui components and TailwindCSS design patterns throughout the interface

### Out of Scope
- Template import functionality (deferred to future version)
- Multi-user collaboration or real-time editing
- Template versioning or revision history
- Email sending/delivery functionality
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

1. **Given** the PostCraft package is installed, **When** I run `npm run studio` or `yarn studio`, **Then** the local studio server starts and the dashboard loads at localhost:3579 with a welcome screen
2. **Given** I'm on the dashboard, **When** I look at the navigation, **Then** I see clear options to access Templates and other sections
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
6. **Given** I have many templates, **When** I scroll the list, **Then** templates load efficiently with pagination or infinite scroll
7. **Given** I'm viewing templates, **When** I use keyboard navigation, **Then** I can navigate through template cards using arrow keys

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
5. **Given** I'm creating a template, **When** the save operation fails, **Then** I see an error message and my work is not lost
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
6. **Given** I'm editing a template, **When** the save fails, **Then** I see a clear error message and can retry
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

### User Story 6 - Export Email Template (Priority: P3)

As a developer, I want to export my email templates in multiple formats (React component, HTML, JSON, plain text) so that I can integrate them into my application codebase.

**Why this priority**: Export capabilities enable developers to actually use the templates they create, bridging the gap between design and implementation. Multiple format support provides flexibility for different use cases.

**Independent Test**: Can be fully tested by selecting a template, choosing each export format, and verifying the exported content is valid and usable in each format with proper formatting and structure.

**Acceptance Scenarios**:

1. **Given** I'm viewing a template, **When** I click "Export", **Then** I see export options for React component, HTML, JSON, and plain text
2. **Given** I select React component export, **When** the export completes, **Then** I receive a valid React component file with proper imports and structure
3. **Given** I select HTML export, **When** the export completes, **Then** I receive a valid HTML file with inline styles ready for email clients
4. **Given** I select JSON export, **When** the export completes, **Then** I receive a JSON file containing the template structure compatible with react-email-editor
5. **Given** I select plain text export, **When** the export completes, **Then** I receive a plain text version of the email content
6. **Given** I'm exporting a template, **When** I want to copy instead of download, **Then** I have an option to copy the export content to clipboard
7. **Given** export is in progress, **When** the system is generating the export, **Then** I see a loading indicator with progress feedback
8. **Given** export fails, **When** an error occurs, **Then** I see a clear error message explaining what went wrong

---

### User Story 7 - Template Variables Management (Priority: P3)

As a developer, I want to define and manage template variables (like NAME, AGE) within my email templates so that I can create dynamic, personalized emails.

**Why this priority**: Variables enable dynamic content and personalization, which is essential for production email templates. This adds significant value but depends on having basic template management working first.

**Independent Test**: Can be fully tested by creating a template with variables, defining variable metadata (type, fallback values), and verifying variables are properly recognized and exported with the template.

**Acceptance Scenarios**:

1. **Given** I'm creating/editing a template, **When** I add variables using {{{VARIABLE_NAME}}} syntax, **Then** the system detects and lists all variables
2. **Given** variables are detected, **When** I view the variable panel, **Then** I can define the type (string, number) and fallback value for each variable
3. **Given** I define a variable with a fallback value, **When** I preview the template, **Then** the fallback value is displayed in place of the variable
4. **Given** I have optional variables, **When** I export the template, **Then** the export includes variable metadata and usage documentation
5. **Given** I'm managing variables, **When** I remove a variable from the template, **Then** the variable is removed from the variable list
6. **Given** I have validation errors in variable definitions, **When** I try to save, **Then** I see clear error messages about what needs to be fixed

---

### Edge Cases

- What happens when the user navigates to localhost:3579 but the server isn't running? Display a connection error with instructions to run `npm run studio` or `yarn studio`.
- What happens when a template name contains special characters or is very long? Validate and sanitize template names, enforce character limits.
- What happens when the user tries to export a template with no content? Show a warning that the template is empty and ask for confirmation.
- What happens when multiple templates have the same name? Prevent duplicate names with validation or auto-append a number suffix.
- What happens when the react-email-editor fails to load due to network issues? Display an error state with retry option and fallback to raw HTML editing.
- What happens when a user has hundreds of templates? Implement pagination or virtual scrolling to maintain performance.
- What happens when a template's JSON structure is corrupted? Detect corruption during load and offer recovery options or safe defaults.
- What happens when the user closes the browser while editing? Implement auto-save or draft functionality to prevent data loss.
- What happens when the same template is opened in multiple browser tabs? Enforce single-editor lock - first tab gets edit mode, others show read-only with notification.
- What happens when exported React components contain invalid variable names? Sanitize variable names to be valid JavaScript identifiers.
- What happens when a template uses deprecated react-email-editor features? Display migration warnings and provide update guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST serve the local studio dashboard on localhost:3579 when started
- **FR-002**: System MUST display a functional navigation interface following shadcn/ui design patterns
- **FR-003**: System MUST use shadcn/ui components exclusively for all UI elements throughout the interface
- **FR-004**: System MUST apply TailwindCSS design patterns consistently across all pages and components
- **FR-005**: System MUST provide a /templates route that displays all email templates
- **FR-004**: System MUST display an empty state on /templates when no templates exist
- **FR-005**: System MUST allow users to create new email templates via a "Create New Template" action
- **FR-006**: System MUST integrate react-email-editor for visual template design and editing
- **FR-007**: System MUST allow users to edit existing email templates
- **FR-008**: System MUST allow users to delete email templates with confirmation
- **FR-009**: System MUST persist templates as JSON files in a local templates directory between server restarts
- **FR-010**: System MUST export templates as React components with proper imports and structure
- **FR-011**: System MUST export templates as HTML with inline styles for email clients
- **FR-012**: System MUST export templates as JSON in react-email-editor compatible format
- **FR-013**: System MUST export templates as plain text with content extracted
- **FR-014**: System MUST provide copy-to-clipboard functionality for all export formats
- **FR-015**: System MUST detect template variables using {{{VARIABLE_NAME}}} syntax
- **FR-016**: System MUST allow users to define variable types (string, number) and fallback values
- **FR-017**: System MUST include variable metadata in template exports
- **FR-018**: System MUST validate template names and prevent duplicates
- **FR-019**: System MUST sanitize template names for file system compatibility when creating JSON files
- **FR-020**: System MUST enforce single-editor lock per template (only one browser tab can edit at a time)
- **FR-021**: System MUST display read-only mode with notification when template is being edited in another tab
- **FR-022**: System MUST display loading states during async operations (loading templates, saving, exporting)
- **FR-023**: System MUST display error states with actionable messages when operations fail
- **FR-024**: System MUST support keyboard navigation for all primary actions
- **FR-025**: System MUST warn users about unsaved changes before navigation
- **FR-026**: System MUST handle template list pagination or virtual scrolling for large datasets
- **FR-027**: System MUST provide visual feedback for all user actions (success, error, loading)
- **FR-028**: System MUST follow WCAG 2.1 AA accessibility standards

### UI/UX Design Requirements

- **UI-001**: System MUST use shadcn/ui components exclusively for all user interface elements
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

### Key Entities

- **Email Template**: Represents a designed email with metadata
  - Name: Unique identifier for the template
  - Content: The email design in react-email-editor JSON format
  - HTML: Rendered HTML version of the template
  - Variables: List of dynamic variables used in the template
  - Created Date: Timestamp of template creation
  - Updated Date: Timestamp of last modification

- **Template Variable**: Represents a dynamic placeholder in email templates
  - Key: Variable name (e.g., "NAME", "AGE")
  - Type: Data type (string, number)
  - Fallback Value: Default value when variable is not provided
  - Optional: Whether the variable is required or optional

- **Export Format**: Represents different export output types
  - React Component: JSX/TSX file with proper imports
  - HTML: Standalone HTML with inline styles
  - JSON: react-email-editor structure
  - Plain Text: Text-only content extraction

### Assumptions

- The local studio runs as a standalone server process that developers start via npm/yarn script commands
- Developers run `npm run studio` or `yarn studio` to launch the local studio server
- Templates are stored as individual JSON files in a local templates directory (file system storage)
- Each template file contains the complete template data including metadata, content, and variables
- Template file names are derived from template names (sanitized for file system compatibility)
- All UI elements use shadcn/ui components exclusively - no custom component alternatives allowed
- If a required UI pattern lacks a shadcn/ui component, implementation must pause for user guidance
- TailwindCSS is used for all styling following utility-first design patterns
- Export functionality provides download files or clipboard copy, not direct code integration
- Template variables follow Handlebars-style triple-brace syntax: {{{VARIABLE_NAME}}}
- Authentication is not required for local studio access (runs on localhost for single developer)
- The react-email-editor is the Unlayer Email Editor React component
- Templates are personal to the developer's local environment, not shared across team members
- Export format for React components produces functional components compatible with modern React

## Clarifications

### Session 2025-10-18

- Q: Template Storage Mechanism - File system storage or SQLite database? → A: File system storage - Each template as a JSON file in a templates directory
- Q: Template Import Capability - Should users be able to import templates from files? → A: No import capability - Export only for initial version
- Q: Server Startup Command - How do developers start the local studio? → A: npm/yarn script - Run via `npm run studio` or `yarn studio` command
- Q: Concurrent Editing Handling - What happens if same template edited in multiple tabs? → A: Single edit lock - Only one tab can edit at a time, others show read-only
- Q: shadcn/ui Component Usage - How strictly should shadcn/ui components be enforced? → A: Strict enforcement - Mandate shadcn/ui for ALL UI elements; if component not found, notify user to provide solution

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
- **SC-010**: Template variable detection correctly identifies 100% of {{{VARIABLE_NAME}}} patterns in templates
- **SC-011**: The dashboard maintains consistent shadcn/ui design patterns across all pages and components
- **SC-012**: Zero data loss occurs during template editing sessions (via auto-save or unsaved change warnings)

