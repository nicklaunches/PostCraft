/**
 * @fileoverview Unified template page component for creating and editing email templates.
 *
 * This component provides a full-featured interface for both creating new templates and
 * editing existing ones. It uses the useTemplateEditor hook for state management and
 * supports all key features like variable detection, autosave warnings, and validation.
 *
 * **Modes:**
 * - create: Creating a new template with a name input field
 * - edit: Editing an existing template (loads data via API)
 *
 * **Key Features:**
 * - Visual email editor using react-email-editor
 * - Automatic merge tag variable detection ({{VARIABLE_NAME}})
 * - Variable management panel with type/fallback/required settings
 * - Real-time validation for template names (create mode)
 * - Unsaved changes warning (beforeunload)
 * - Keyboard shortcuts (Cmd+S / Ctrl+S to save)
 * - Loading and error states with user-friendly feedback
 * - Refresh variables functionality
 *
 * @see hooks/use-template-editor.tsx - Main state management hook
 * @see components/template-editor.tsx - React Email Editor wrapper
 * @see components/variable-manager.tsx - Variable configuration panel
 */

"use client";

import React, { useState, useEffect } from "react";
import { TemplateEditor } from "@/components/template-editor";
import { VariableManager } from "@/components/variable-manager";
import { TemplateExport } from "@/components/template-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { useTemplateEditor } from "@/hooks/use-template-editor";
import { detectVariables } from "@/lib/utils/variable-detection";

/**
 * Template data structure returned from GET /api/templates/[id]
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

interface TemplatePageProps {
  mode: "create" | "edit";
  templateId?: string;
}

export function TemplatePage({ mode, templateId }: TemplatePageProps) {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  // Use the template editor hook
  const {
    editorRef,
    templateName,
    setTemplateName,
    nameError,
    isEditorReady,
    isSaving,
    hasUnsavedChanges,
    variables,
    setVariables,
    detectedVariables,
    setDetectedVariables,
    handleEditorReady,
    handleSave: hookHandleSave,
    handleCancel,
    initializeVariables,
    markAsChanged,
  } = useTemplateEditor({
    mode,
    templateId,
    onSaveSuccess: () => {
      if (mode === "edit") {
        // Refresh template data after save
        fetchTemplate();
        setSaveError(null);
      }
    },
  });

  // Fetch template data (edit mode only)
  const fetchTemplate = async () => {
    if (mode !== "edit" || !templateId) return;

    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await fetch(`/api/templates/${templateId}`);

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

  // Fetch template on mount (edit mode)
  useEffect(() => {
    if (mode === "edit") {
      fetchTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, templateId]);

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

  // Handle refresh variables - re-detect from current editor content
  const handleRefreshVariables = async () => {
    if (!isEditorReady || !editorRef.current?.editor) {
      return;
    }

    // Export HTML from editor to detect variables
    editorRef.current.editor.exportHtml((data: { html: string }) => {
      const html = data.html;
      const detected = detectVariables(html);
      setDetectedVariables(detected);
    });
  };

  // Loading state (edit mode)
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

  // Error state (edit mode)
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

  // Template not found (edit mode, should be caught by loadError)
  if (mode === "edit" && !template) {
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
            <h1 className="text-2xl font-bold">
              {mode === "create" ? "Create New Template" : "Edit Template"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "create" ? (
                "Design your email template using the visual editor"
              ) : (
                <>
                  Editing: <strong>{template?.name}</strong>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {mode === "edit" && template && (
              <Button
                variant="outline"
                onClick={() => setShowExport(true)}
                disabled={isSaving}
              >
                Export
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isEditorReady}>
              {isSaving
                ? "Saving..."
                : mode === "create"
                ? "Save Template"
                : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Template Name Input (create mode) or Template Info (edit mode) */}
      <div className="border-b bg-muted/50 p-4">
        <div className="mx-auto max-w-7xl">
          {mode === "create" ? (
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
                  Use lowercase letters, numbers, hyphens, and underscores only
                  (1-100 characters)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                Last updated:{" "}
                {template &&
                  new Date(template.updatedAt).toLocaleString(undefined, {
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
          )}
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

      {/* Main Content: Editor + Variables Panel */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "100%" }}>
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <TemplateEditor
            ref={editorRef}
            onReady={handleEditorReady}
            onChange={markAsChanged}
            initialDesign={mode === "edit" && template ? template.content : undefined}
          />
        </div>

        {/* Variables Panel */}
        <div className="w-96 border-l bg-card overflow-y-auto">
          <div className="p-6">
            <VariableManager
              variables={variables}
              onChange={(newVariables) => {
                setVariables(newVariables);
                markAsChanged();
              }}
              detectedVariables={detectedVariables}
              label="Email Variables"
              showEmpty={true}
              onRefresh={handleRefreshVariables}
            />
          </div>
        </div>
      </div>

      {/* Editor Loading Overlay */}
      {!isEditorReady && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>
                {mode === "create" ? "Loading Editor..." : "Loading Template..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {mode === "create"
                  ? "Please wait while the email editor loads."
                  : "Please wait while the email editor loads your template."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      <div className="border-t bg-muted/30 px-4 py-2">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Press{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              Cmd+S
            </kbd>{" "}
            (Mac) or{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              Ctrl+S
            </kbd>{" "}
            (Windows) to save
          </p>
        </div>
      </div>

      {/* Export Dialog */}
      {showExport && template && (
        <TemplateExport
          templateId={template.id}
          templateName={template.name}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
