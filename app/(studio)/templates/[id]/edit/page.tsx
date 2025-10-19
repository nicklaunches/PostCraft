/**
 * @fileoverview Template editing page component for the PostCraft local studio.
 *
 * Provides a full-featured email template editor allowing users to modify existing
 * template designs using react-email-editor and sync changes back to the database.
 *
 * **Key Features**:
 * - Loads template content (react-email-editor JSON design) from database via GET /api/templates/[id]
 * - Renders visual email editor with full design tools
 * - Automatically detects merge tag variables ({{NAME}}, {{ORDER_ID}}, etc.) from design
 * - Saves template changes with atomic transaction: content + variables
 * - Unsaved changes warning prevents accidental navigation without saving
 * - Keyboard shortcut (Cmd+S / Ctrl+S) for quick save
 * - Error recovery with retry button on failed saves
 * - Loading and error states with user-friendly feedback
 *
 * **Data Flow**:
 * 1. Page mounts → Fetch template by ID via GET /api/templates/[id]
 * 2. Editor loads → Pass template.content to editor.loadDesign()
 * 3. User edits → Track hasUnsavedChanges state
 * 4. User saves (Save button or Cmd+S) → Call editor.saveDesign() to get design JSON
 * 5. Export HTML → Call editor.exportHtml() to get HTML with merge tags
 * 6. Parse variables → Use regex to detect {{VARIABLE}} patterns in HTML
 * 7. Send to API → PUT /api/templates/[id] with content + variables
 * 8. Update UI → Refresh template data, show success toast, update updatedAt timestamp
 *
 * **Error Handling**:
 * - 404 Template Not Found: Show error alert with link to /templates
 * - Network errors: Show error toast with retry button
 * - Editor not ready: Prevent saves until editor fully loads
 * - Unsaved changes: Browser warning prevents data loss on accidental navigation
 *
 * **Accessibility**:
 * - All interactive elements have aria-labels for screen readers
 * - Keyboard navigation with Tab key through save/cancel buttons
 * - Keyboard shortcut hints displayed at bottom of page
 * - Error messages announced to screen readers via Alert component
 *
 * @example
 * // User journey:
 * 1. Navigate to /templates/5/edit
 * 2. Template loads with design shown in editor
 * 3. User modifies design, adds merge tags like {{CUSTOMER_NAME}}
 * 4. User presses Cmd+S or clicks "Save Changes"
 * 5. Toast shows "Saving template..."
 * 6. Variables are detected from HTML
 * 7. PUT request sent with new content and variables
 * 8. Success toast shows "Template saved!"
 * 9. updatedAt timestamp updated on page
 * 10. hasUnsavedChanges cleared (unsaved indicator disappears)
 *
 * @see components/template-editor.tsx - React Email Editor wrapper component
 * @see app/api/templates/[id]/route.ts - PUT endpoint for saving templates
 * @see lib/db/schema.ts - Template and TemplateVariable database schemas
 */
"use client";

import React, { useState, useEffect } from "react";
import { TemplateEditor } from "@/components/template-editor";
import { VariableManager } from "@/components/variable-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { useTemplateEditor } from "@/hooks/use-template-editor";

/**
 * Template data structure returned from GET /api/templates/[id]
 * Includes template metadata and all associated merge tag variables
 */
interface TemplateData {
  id: number;
  name: string;
  content: object;
  createdAt: string;
  updatedAt: string;
  variables: Array<{
    id: number;
    templateId: number;
    key: string;
    type: string;
    fallbackValue: string | null;
    isRequired: boolean;
    createdAt: string;
  }>;
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Use the template editor hook
  const {
    editorRef,
    isEditorReady,
    isSaving,
    hasUnsavedChanges,
    variables,
    setVariables,
    detectedVariables,
    handleEditorReady,
    handleSave: hookHandleSave,
    handleCancel,
    initializeVariables,
  } = useTemplateEditor({
    mode: "edit",
    templateId: params.id,
    onSaveSuccess: () => {
      // Refresh template data after save
      fetchTemplate();
      setSaveError(null);
    },
  });

  // Fetch template data
  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await fetch(`/api/templates/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setLoadError("Template not found");
        } else {
          const error = await response.json();
          setLoadError(error.error || "Failed to load template");
        }
        return;
      }

      const data = await response.json();
      setTemplate(data.template);

      // Initialize variables when template is loaded
      if (data.template.variables) {
        console.log("EditTemplatePage: Initializing variables from template data");
        initializeVariables(data.template.variables);
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load template"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch template on mount
  useEffect(() => {
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Wrapper for handleSave to catch errors and update UI
  const handleSave = async () => {
    try {
      setSaveError(null);
      await hookHandleSave();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setSaveError(errorMessage);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        {/* Header Skeleton */}
        <div className="border-b bg-background p-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex-1">
              <Skeleton className="mb-2 h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>

        {/* Template Info Skeleton */}
        <div className="border-b bg-muted/50 p-4">
          <div className="mx-auto max-w-7xl">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Editor Loading */}
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Loading Template...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please wait while we load your template.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Template</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{loadError}</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/templates">Back to Templates</Link>
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Template not found (should be caught by loadError, but just in case)
  if (!template) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Template Not Found</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              The template you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="outline" asChild>
              <Link href="/templates">Back to Templates</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Edit Template</h1>
            <p className="text-sm text-muted-foreground">
              Editing: <strong>{template.name}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isEditorReady}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="border-b bg-muted/50 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              Last updated:{" "}
              {new Date(template.updatedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            {hasUnsavedChanges && (
              <span className="ml-4 font-semibold text-orange-600">
                • Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className="border-b bg-background p-4">
          <div className="mx-auto max-w-7xl">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to Save</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">{saveError}</p>
                <Button onClick={handleSave} variant="outline" size="sm">
                  Retry Save
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "100%" }}>
        <div className="flex-1 overflow-hidden">
          <TemplateEditor
            ref={editorRef}
            onReady={handleEditorReady}
            initialDesign={template.content}
          />
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

      {/* Editor Loading Overlay */}
      {!isEditorReady && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Loading Editor...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please wait while the email editor loads your template.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      <div className="border-t bg-muted/30 px-4 py-2">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Press <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">Cmd+S</kbd> (Mac) or <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">Ctrl+S</kbd> (Windows) to save
          </p>
        </div>
      </div>
    </div>
  );
}
