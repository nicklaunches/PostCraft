# Feature Specification: Template Import from Unlayer JSON

**Feature Branch**: `002-template-import`
**Created**: October 19, 2025
**Status**: Draft
**Input**: User description: "When user on /templates page user should see 'Import Template' left from '+ Create Template' button. When user will click it it should open a modal where user should upload Unlayer JSON file. On success, open editor at /templates/new with the loaded JSON where user can name and save the template."

## Clarifications

### Session 2025-10-19

- Q: What file format should users upload for template import? → A: Unlayer JSON export files (.json)
- Q: What should happen after a successful file upload? → A: Redirect to /templates/new with the loaded JSON in the editor
- Q: Where should the user name the template? → A: In the editor view at /templates/new before saving
- Q: What should happen when a user tries to import an invalid JSON file? → A: Show error message indicating the file is not valid Unlayer JSON
- Q: What maximum file size limit should be enforced for JSON uploads? → A: 5 MB - More than sufficient for Unlayer design JSON
- Q: Should the system validate the JSON structure? → A: Yes - Verify it contains valid Unlayer design structure before loading into editor

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Unlayer JSON Template (Priority: P1)

Users can upload Unlayer JSON export files to quickly load existing template designs into the editor, allowing them to continue editing or save pre-designed templates without starting from scratch.

**Why this priority**: This is the core functionality that delivers immediate value - it enables users to import Unlayer template designs, edit them if needed, and save them to their template library.

**Independent Test**: Can be fully tested by clicking "Import Template" button, uploading a valid Unlayer JSON file, verifying the editor opens at /templates/new with the loaded design, naming the template, and saving it.

**Acceptance Scenarios**:

1. **Given** a user is on the /templates page, **When** they look at the header area, **Then** they see an "Import Template" button positioned to the left of the "+ Create Template" button
2. **Given** a user clicks the "Import Template" button, **When** the modal opens, **Then** they see two options: a textarea to paste JSON and a file upload area
3. **Given** a user has pasted valid Unlayer JSON into the textarea, **When** they click import, **Then** the system validates the JSON and redirects to /templates/new with the design loaded
4. **Given** a user has selected a valid Unlayer JSON file, **When** they click upload, **Then** the system validates the JSON and redirects to /templates/new with the design loaded
5. **Given** a user is on /templates/new with imported JSON loaded, **When** they enter a template name and click save, **Then** the template is created and they are redirected to the template list
6. **Given** a user has successfully imported and saved a template, **When** they view the templates list, **Then** the newly imported template appears with the name they provided
7. **Given** a user imported a template, **When** they click to edit it, **Then** all design elements display correctly in the editor
8. **Given** a user has both pasted JSON and uploaded a file, **When** they attempt to import, **Then** the system uses the file upload (file takes precedence)

---

### User Story 2 - Validation and Error Handling (Priority: P2)

Users receive clear feedback when upload errors occur, such as invalid file formats, corrupted JSON, or file size limits, helping them understand what went wrong and how to fix it.

**Why this priority**: Prevents frustration and support requests by providing clear guidance when imports fail, ensuring users understand the expected JSON structure.

**Independent Test**: Can be tested independently by attempting to upload various invalid files (wrong format, invalid JSON, oversized files, non-Unlayer JSON) and verifying appropriate error messages appear for each scenario.

**Acceptance Scenarios**:

1. **Given** a user attempts to upload a non-JSON file, **When** they select the file, **Then** an error message displays stating "Please upload a valid JSON file"
2. **Given** a user uploads a JSON file that is not valid Unlayer format, **When** they submit the import, **Then** an error message displays stating "File does not contain valid Unlayer design data"
3. **Given** a user uploads a JSON file exceeding the size limit, **When** they select the file, **Then** an error message displays stating "File size exceeds maximum limit of 5 MB"
4. **Given** a user uploads a corrupted or invalid JSON file, **When** they submit the import, **Then** an error message displays stating "Invalid JSON format"
5. **Given** a user pastes invalid JSON into the textarea, **When** they submit the import, **Then** an error message displays stating "Invalid JSON format"
6. **Given** a user pastes JSON that is not valid Unlayer format, **When** they submit the import, **Then** an error message displays stating "File does not contain valid Unlayer design data"
7. **Given** a user tries to import without pasting JSON or uploading a file, **When** they click import, **Then** an error message displays stating "Please paste JSON or upload a file"

---

### User Story 3 - Upload Progress and Confirmation (Priority: P3)

Users see visual feedback during the upload process and are smoothly transitioned to the editor when the import completes successfully.

**Why this priority**: Enhances user experience by providing transparency during file upload and processing, creating a seamless workflow from import to editing.

**Independent Test**: Can be tested by uploading a valid JSON file and observing the loading state during upload/processing and verifying smooth transition to the editor.

**Acceptance Scenarios**:

1. **Given** a user has submitted a valid JSON file, **When** the upload is processing, **Then** a loading indicator displays with appropriate messaging like "Loading template..."
2. **Given** the upload has completed successfully, **When** processing finishes, **Then** the user is automatically redirected to /templates/new with the design loaded in the editor
3. **Given** a successful import and redirect, **When** the editor loads, **Then** all design elements from the imported JSON are visible in the editor
4. **Given** a user is on the editor page after import, **When** they view the page, **Then** they can immediately name and save the template

---

### Edge Cases

- What happens when a JSON file contains invalid Unlayer structure?
  - System validates the JSON structure and displays error message "File does not contain valid Unlayer design data"

- What happens when pasted JSON contains invalid Unlayer structure?
  - System validates the JSON structure and displays error message "File does not contain valid Unlayer design data"

- What happens when the JSON file or pasted content is corrupted or contains syntax errors?
  - System catches JSON parse errors and displays "Invalid JSON format" error message

- What happens when a user tries to import while another import is in progress?
  - System disables the "Import" button while an import operation is active, preventing concurrent imports

- What happens when the user closes the editor without saving after import?
  - Standard unsaved changes warning applies; imported JSON is not automatically saved to database

- What happens when the JSON file exceeds 5 MB?
  - System rejects the file with error message "File size exceeds maximum limit of 5 MB"

- What happens when pasted JSON exceeds size limit?
  - System validates pasted content size and displays error if exceeds 5 MB equivalent character count

- What happens when both textarea has content and a file is uploaded?
  - File upload takes precedence over pasted content; system uses the uploaded file and ignores textarea

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an "Import Template" button on the /templates page positioned to the left of the "+ Create Template" button
- **FR-002**: System MUST open a modal dialog when the "Import Template" button is clicked
- **FR-003**: Modal MUST contain two input options: a textarea for pasting JSON and a file upload input that accepts only .json files
- **FR-004**: System MUST accept JSON from either textarea paste or file upload
- **FR-005**: System MUST prioritize file upload over textarea content when both are provided
- **FR-006**: System MUST validate that the uploaded file is a valid JSON file
- **FR-007**: System MUST validate that pasted textarea content is valid JSON
- **FR-008**: System MUST parse the JSON content (from file or textarea) and validate it contains valid Unlayer design structure (must have 'body', 'counters', 'schemaVersion' properties)
- **FR-009**: System MUST store the JSON content temporarily for loading into the editor
- **FR-010**: System MUST redirect user to /templates/new upon successful JSON validation
- **FR-011**: System MUST load the imported JSON design into the Unlayer editor at /templates/new
- **FR-012**: User MUST be able to name and save the template from the editor view
- **FR-013**: System MUST enforce a maximum file size limit of 5 MB for JSON uploads
- **FR-014**: System MUST enforce a maximum content size limit equivalent to 5 MB for pasted JSON (approximately 5 million characters)
- **FR-015**: System MUST display appropriate error messages for validation failures (invalid file type, invalid JSON, invalid Unlayer structure, size limit exceeded, no input provided)
- **FR-016**: System MUST provide visual feedback during the upload and processing stages (loading state)
- **FR-017**: System MUST disable the "Import" button while an import operation is in progress to prevent concurrent imports
- **FR-018**: System MUST handle and display user-friendly error messages for processing failures (corrupt JSON, invalid structure, etc.)
- **FR-019**: System MUST ensure the editor is fully loaded before displaying the imported design

### Non-Functional Requirements

- **NFR-001**: System MUST process JSON files up to 5 MB in size within 2 seconds to ensure responsive user experience
- **NFR-002**: System MUST provide clear feedback at each stage (upload → validation → redirect → editor load)

### Key Entities

- **Template**: Represents an email template with properties including name (user-provided), content (Unlayer design JSON), HTML export, creation timestamp
- **Import Session**: Temporary state during the import process tracking upload progress, validation status, and redirect handling
- **Import Source**: The origin of JSON data - either "textarea" (pasted) or "file" (uploaded), with file taking precedence when both are present

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully import an Unlayer JSON file and see it loaded in the editor in under 2 seconds for files up to 5 MB
- **SC-002**: 95% of valid JSON imports complete without errors
- **SC-003**: Users receive clear, actionable error messages for 100% of failed import attempts, identifying the specific issue (file type, invalid JSON, invalid structure, size limit, etc.)
- **SC-004**: Imported templates display correctly in the editor immediately after redirect, without requiring manual refresh
- **SC-005**: Users can distinguish between the "Import Template" and "Create Template" options easily, with the import button clearly visible on the templates page
- **SC-006**: Users can seamlessly name and save imported templates from the editor view
