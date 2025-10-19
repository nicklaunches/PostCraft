"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EditorRef } from "react-email-editor";
import { TemplateEditor } from "@/components/template-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { validateTemplateName } from "@/lib/utils/validation";

export default function NewTemplatePage() {
  const router = useRouter();
  const editorRef = useRef<EditorRef>(null);
  const [templateName, setTemplateName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

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

  // Track changes in the editor
  const handleEditorReady = () => {
    setIsEditorReady(true);
  };

  // Track changes in name or editor
  useEffect(() => {
    if (templateName || isEditorReady) {
      setHasUnsavedChanges(true);
    }
  }, [templateName, isEditorReady]);

  const handleSave = async () => {
    // Validate template name
    const validation = validateTemplateName(templateName);
    if (!validation.isValid) {
      setNameError(validation.error || "Invalid template name");
      toast.error("Invalid template name", {
        description: validation.error,
      });
      return;
    }
    setNameError("");

    if (!editorRef.current?.editor) {
      toast.error("Editor not ready", {
        description: "Please wait for the editor to load",
      });
      return;
    }

    setIsSaving(true);
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
          fetch("/api/templates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: validation.sanitized,
              content: design,
              variables: uniqueVariables,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create template");
              }
              return response.json();
            })
            .then(() => {
              toast.dismiss(savingToast);
              toast.success("Template created!", {
                description: `Template "${validation.sanitized}" has been created successfully.`,
              });
              setHasUnsavedChanges(false);
              // Redirect to templates list
              setTimeout(() => {
                router.push("/templates");
              }, 500);
            })
            .catch((error) => {
              toast.dismiss(savingToast);
              
              // Handle duplicate name error
              if (error.message.includes("already exists")) {
                setNameError("Template name already exists");
                toast.error("Template name already exists", {
                  description: "Please choose a different name for your template.",
                });
              } else {
                toast.error("Failed to save template", {
                  description: error.message || "An unknown error occurred",
                });
              }
              setIsSaving(false);
            });
        });
      });
    } catch (error) {
      toast.dismiss(savingToast);
      toast.error("Failed to save template", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
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
                Use lowercase letters, numbers, hyphens, and underscores only (1-100 characters)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <TemplateEditor
          ref={editorRef}
          onReady={handleEditorReady}
        />
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
