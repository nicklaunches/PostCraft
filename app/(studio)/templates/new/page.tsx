/**
 * Template Creation Page - Create New Email Template
 *
 * This page provides the UI for creating new email templates using react-email-editor.
 * Users design email templates visually, name them, and the system auto-detects merge tags
 * to create variable metadata. Upon save, the template design and variables are persisted
 * via POST /api/templates.
 *
 * **User Journey:**
 * 1. User navigates to /templates/new (from template list "Create New" button)
 * 2. Editor loads with blank canvas (react-email-editor Unlayer)
 * 3. User enters template name (validated: 1-100 chars, alphanumeric + hyphens/underscores)
 * 4. User designs email using visual editor
 * 5. User clicks "Save Template" button
 * 6. System exports design JSON and HTML from editor
 * 7. System extracts merge tags ({{VARIABLE}}) from HTML using regex
 * 8. System POSTs to /api/templates with name, design, and variables
 * 9. On success: Shows toast notification and redirects to /templates
 * 10. On error: Shows error toast and keeps user on page with design preserved
 *
 * **Key Features:**
 * - Unsaved changes warning using beforeunload event (per FR-025)
 * - Real-time template name validation with instant feedback
 * - Automatic merge tag detection from exported HTML
 * - Loading state during save with toast notification
 * - Error handling for duplicate names, invalid names, server errors
 * - Editor ready state tracking to prevent premature save
 * - Keyboard accessibility with proper aria labels and form controls
 *
 * **Form Validation:**
 * - Template name: 1-100 characters (enforced by validateTemplateName)
 * - Template name: Alphanumeric, hyphens, underscores only
 * - Template name: Unique across all templates (server-side check returns 409)
 * - Template content: Must be valid JSON from react-email-editor
 *
 * **Merge Tag Detection:**
 * - Regex pattern: /\{\{([A-Z_][A-Z0-9_]*)\}\}/g
 * - Extracts uppercase variables from HTML (e.g., {{USER_NAME}})
 * - Auto-detects variable names from editor content
 * - Removes duplicates before API call
 * - Each variable defaults to: type='string', fallbackValue=null, isRequired=false
 *
 * **State Management:**
 * - templateName: Template name input value
 * - nameError: Validation error message for template name
 * - isSaving: Indicates save in progress (disables buttons)
 * - hasUnsavedChanges: Tracks if user has made changes (for beforeunload)
 * - isEditorReady: Tracks when react-email-editor is fully loaded
 *
 * **Error Handling:**
 * - 400 Bad Request: Invalid template name → Show name error + toast
 * - 409 Conflict: Template name exists → Show name error + toast
 * - 500 Server Error: Database error → Show error toast
 * - Network error: Save fails → Show error toast, keep design
 *
 * **Performance:**
 * - Editor lazy-loads via react-email-editor library
 * - Design JSON exported once on save (not continuously)
 * - HTML export happens after design export (nested callbacks)
 * - API call made after variable extraction
 * - Redirect happens after success (500ms delay for UX)
 *
 * **Accessibility:**
 * - Template name input: aria-invalid, aria-describedby for errors
 * - Buttons: Disabled state during save
 * - Error messages: Associated with inputs
 * - Loading toast: Provides feedback during save
 * - Unsaved warning: Browser beforeunload dialog
 *
 * **Layout:**
 * - Header: "Create New Template" title + Save/Cancel buttons
 * - Name input: Template name field with helper text
 * - Editor: Full-height react-email-editor component
 * - Loading state: Centered card while editor loads
 *
 * **Related Components:**
 * - TemplateEditor: React-email-editor wrapper component
 * - Button: shadcn/ui button component
 * - Input: shadcn/ui input component
 * - Card: shadcn/ui card for loading state
 * - Sonner: Toast notifications library
 *
 * **Related API Routes:**
 * - POST /api/templates: Create template endpoint
 *
 * **Related Utilities:**
 * - validateTemplateName: Validates template name format
 *
 * @module app/(studio)/templates/new/page
 * @requires react - React hooks (useRef, useState, useEffect)
 * @requires next/navigation - useRouter for navigation
 * @requires react-email-editor - Email editor component and types
 * @requires @/components/template-editor - TemplateEditor wrapper component
 * @requires @/components/ui/button - Button component
 * @requires @/components/ui/input - Input component
 * @requires @/components/ui/card - Card component
 * @requires sonner - Toast notifications
 * @requires @/lib/utils/validation - validateTemplateName utility
 *
 * @example
 * ```typescript
 * // User navigates to create new template
 * // Page loads with empty editor
 * // User enters "welcome-email" as name
 * // User designs email with {{USER_NAME}} and {{DISCOUNT}} merge tags
 * // User clicks "Save Template"
 * // System extracts variables and creates template
 * // User redirected to /templates with success notification
 * ```
 */

"use client";

import React from "react";
import { TemplateEditor } from "@/components/template-editor";
import { VariableManager } from "@/components/variable-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTemplateEditor } from "@/hooks/use-template-editor";

export default function NewTemplatePage() {
    const {
        editorRef,
        templateName,
        setTemplateName,
        nameError,
        isEditorReady,
        isSaving,
        variables,
        setVariables,
        detectedVariables,
        handleEditorReady,
        handleSave,
        handleCancel,
    } = useTemplateEditor({
        mode: "create",
    });

    return (
        <div className="flex h-screen flex-col">
            {/* Header */}
            <div className="border-b bg-background p-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Create New Template</h1>
                        <p className="text-sm text-muted-foreground">
                            Design your email template using the visual editor
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || !isEditorReady}>
                            {isSaving ? "Saving..." : "Save Template"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Template Name Input */}
            <div className="border-b bg-muted/50 p-4">
                <div className="mx-auto max-w-7xl">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <label htmlFor="templateName" className="text-sm font-medium">
                                Template Name *
                            </label>
                            <Input
                                id="templateName"
                                type="text"
                                placeholder="e.g., welcome-email"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className={nameError ? "border-red-500" : ""}
                                disabled={isSaving}
                                aria-invalid={!!nameError}
                                aria-describedby={nameError ? "name-error" : undefined}
                            />
                            {nameError && (
                                <p id="name-error" className="mt-1 text-sm text-red-600">
                                    {nameError}
                                </p>
                            )}
                            <p className="mt-1 text-sm text-muted-foreground">
                                Use lowercase letters, numbers, hyphens, and underscores only (1-100
                                characters)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Editor + Variables Panel */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor */}
                <div className="flex-1 overflow-hidden">
                    <TemplateEditor ref={editorRef} onReady={handleEditorReady} />
                </div>

                {/* Variables Panel */}
                <div className="w-96 border-l bg-card overflow-y-auto">
                    <div className="p-6">
                        <VariableManager
                            variables={variables}
                            onChange={setVariables}
                            detectedVariables={detectedVariables}
                            label="Email Variables"
                            showEmpty={true}
                        />
                    </div>
                </div>
            </div>

            {/* Info Alert */}
            {!isEditorReady && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Card className="w-96">
                        <CardHeader>
                            <CardTitle>Loading Editor...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Please wait while the email editor loads.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
