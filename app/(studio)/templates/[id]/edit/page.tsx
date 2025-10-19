"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EditorRef } from "react-email-editor";
import { TemplateEditor } from "@/components/template-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertCircle, Info } from "lucide-react";
import Link from "next/link";

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
  const router = useRouter();
  const editorRef = useRef<EditorRef>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch template data
  useEffect(() => {
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
      } catch (error) {
        console.error("Error fetching template:", error);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load template"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [params.id]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Track changes when editor is modified
  const handleEditorReady = () => {
    setIsEditorReady(true);

    // Load template design into editor
    if (template?.content && editorRef.current?.editor) {
      editorRef.current.editor.loadDesign(template.content as any);
    }
  };

  // Keyboard shortcut for save (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isEditorReady && !isSaving) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditorReady, isSaving, hasUnsavedChanges]);

  const handleSave = async () => {
    // Ensure editor is ready
    if (!isEditorReady || !editorRef.current?.editor || !template) {
      toast.error("Editor not ready", {
        description: "Please wait for the editor to load",
      });
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const savingToast = toast.loading("Saving template...");

    try {
      // Export design from editor
      editorRef.current.editor.saveDesign((design: object) => {
        // Export HTML with merge tags
        editorRef.current?.editor?.exportHtml((data: { html: string }) => {
          const html = data.html;

          // Extract variables from HTML using regex
          const variableMatches = html.matchAll(/\{\{([A-Z_]+)\}\}/g);
          const variables = Array.from(variableMatches).map((match) => ({
            key: match[1],
            type: "string" as const,
            fallbackValue: null,
            isRequired: false,
          }));

          // Remove duplicates
          const uniqueVariables = variables.filter(
            (v, i, arr) => arr.findIndex((t) => t.key === v.key) === i
          );

          // Send to API
          fetch(`/api/templates/${params.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: design,
              variables: uniqueVariables,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update template");
              }
              return response.json();
            })
            .then((data) => {
              toast.dismiss(savingToast);
              toast.success("Template saved!", {
                description: `Template "${template.name}" has been updated successfully.`,
              });
              setHasUnsavedChanges(false);
              setSaveError(null);
              // Update local template data
              setTemplate(data.template);
            })
            .catch((error) => {
              toast.dismiss(savingToast);
              const errorMessage = error.message || "An unknown error occurred";
              setSaveError(errorMessage);
              toast.error("Failed to save template", {
                description: errorMessage,
              });
            })
            .finally(() => {
              setIsSaving(false);
            });
        });
      });
    } catch (error) {
      toast.dismiss(savingToast);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setSaveError(errorMessage);
      toast.error("Failed to save template", {
        description: errorMessage,
      });
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirm) return;
    }
    router.push("/templates");
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
      <div className="flex-1 overflow-hidden">
        <TemplateEditor
          ref={editorRef}
          onReady={handleEditorReady}
          initialDesign={template.content}
        />
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
