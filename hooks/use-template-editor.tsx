/**
 * Custom hook for managing email template editor state and operations.
 * 
 * This hook encapsulates common logic for both creating and editing templates,
 * including editor state, variable management, save operations, and validation.
 * 
 * @module hooks/use-template-editor
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EditorRef } from "react-email-editor";
import { toast } from "sonner";
import { validateTemplateName } from "@/lib/utils/validation";
import { detectVariables } from "@/lib/utils/variable-detection";
import { VariableMetadata } from "@/components/variable-manager";

interface UseTemplateEditorOptions {
  mode: "create" | "edit";
  templateId?: string;
  onSaveSuccess?: () => void;
}

export function useTemplateEditor(options: UseTemplateEditorOptions) {
  const { mode, templateId, onSaveSuccess } = options;
  const router = useRouter();
  const editorRef = useRef<EditorRef>(null);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [nameError, setNameError] = useState("");

  // Editor state
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Variable state
  const [variables, setVariables] = useState<VariableMetadata[]>([]);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

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

  // Track changes in name or editor
  useEffect(() => {
    if (templateName || isEditorReady) {
      setHasUnsavedChanges(true);
    }
  }, [templateName, isEditorReady]);

  // Handle editor ready
  const handleEditorReady = useCallback(() => {
    console.log("useTemplateEditor: handleEditorReady called");
    console.log("useTemplateEditor: Setting isEditorReady to true");
    console.log("useTemplateEditor: editorRef.current before set:", editorRef.current);
    setIsEditorReady(true);
    console.log("useTemplateEditor: isEditorReady state updated");
    
    // Log the editor ref after a small delay to see if it's populated
    setTimeout(() => {
      console.log("useTemplateEditor: editorRef.current after 100ms:", editorRef.current);
      console.log("useTemplateEditor: editorRef.current?.editor after 100ms:", editorRef.current?.editor);
    }, 100);
  }, []);

  // Initialize variables from template data
  const initializeVariables = useCallback((templateVariables: any[]) => {
    if (!templateVariables || templateVariables.length === 0) {
      return;
    }

    const vars: VariableMetadata[] = templateVariables.map((v) => ({
      key: v.key,
      type: (v.type as "string" | "number" | "boolean" | "date") || "string",
      fallbackValue: v.fallbackValue,
      isRequired: v.isRequired,
    }));

    setVariables(vars);
    setDetectedVariables(vars.map((v) => v.key));
    console.log("useTemplateEditor: Initialized variables:", vars);
  }, []);

  // Save template
  const handleSave = useCallback(async () => {
    console.log("useTemplateEditor: handleSave called");
    console.log("useTemplateEditor: isEditorReady =", isEditorReady);
    console.log("useTemplateEditor: editorRef.current =", editorRef.current);
    console.log("useTemplateEditor: editorRef.current?.editor =", editorRef.current?.editor);

    // Validate template name (only for create mode)
    if (mode === "create") {
      const validation = validateTemplateName(templateName);
      if (!validation.isValid) {
        setNameError(validation.error || "Invalid template name");
        toast.error("Invalid template name", {
          description: validation.error,
        });
        return;
      }
      setNameError("");
    }

    // Ensure editor is ready
    if (!isEditorReady) {
      console.error("useTemplateEditor: isEditorReady is false");
      toast.error("Editor not ready", {
        description: "Please wait for the editor to load",
      });
      return;
    }

    if (!editorRef.current) {
      console.error("useTemplateEditor: editorRef.current is null");
      toast.error("Editor not ready", {
        description: "Please wait for the editor to load",
      });
      return;
    }

    if (!editorRef.current.editor) {
      console.error("useTemplateEditor: editorRef.current.editor is null");
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

          // Detect variables from HTML
          const detectedVars = detectVariables(html);
          setDetectedVariables(detectedVars);

          // Use configured variables, but filter to only include detected ones
          // and add any newly detected variables with defaults
          const finalVariables = variables.filter((v) =>
            detectedVars.includes(v.key)
          );

          // Add any newly detected variables
          const newVars = detectedVars
            .filter((key) => !finalVariables.some((v) => v.key === key))
            .map(
              (key): VariableMetadata => ({
                key,
                type: "string",
                fallbackValue: null,
                isRequired: false,
              })
            );

          const allVariables = [...finalVariables, ...newVars];

          // Prepare request
          const url =
            mode === "create"
              ? "/api/templates"
              : `/api/templates/${templateId}`;
          const method = mode === "create" ? "POST" : "PUT";
          const body =
            mode === "create"
              ? {
                  name: validateTemplateName(templateName).sanitized,
                  content: design,
                  variables: allVariables,
                }
              : {
                  content: design,
                  variables: allVariables,
                };

          // Send to API
          fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          })
            .then(async (response) => {
              if (!response.ok) {
                const error = await response.json();
                throw new Error(
                  error.error ||
                    `Failed to ${mode === "create" ? "create" : "update"} template`
                );
              }
              return response.json();
            })
            .then(() => {
              toast.dismiss(savingToast);
              toast.success(
                mode === "create"
                  ? "Template created!"
                  : "Template saved!",
                {
                  description:
                    mode === "create"
                      ? `Template "${validateTemplateName(templateName).sanitized}" has been created successfully.`
                      : "Your changes have been saved successfully.",
                }
              );
              setHasUnsavedChanges(false);

              // Call success callback
              if (onSaveSuccess) {
                onSaveSuccess();
              }

              // Redirect for create mode
              if (mode === "create") {
                setTimeout(() => {
                  router.push("/templates");
                }, 500);
              }
            })
            .catch((error) => {
              toast.dismiss(savingToast);

              // Handle duplicate name error
              if (error.message.includes("already exists")) {
                setNameError("Template name already exists");
                toast.error("Template name already exists", {
                  description:
                    "Please choose a different name for your template.",
                });
              } else {
                toast.error("Failed to save template", {
                  description: error.message || "An unknown error occurred",
                });
              }
            })
            .finally(() => {
              setIsSaving(false);
            });
        });
      });
    } catch (error) {
      toast.dismiss(savingToast);
      toast.error("Failed to save template", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      setIsSaving(false);
    }
  }, [
    mode,
    templateName,
    templateId,
    isEditorReady,
    variables,
    router,
    onSaveSuccess,
  ]);

  // Cancel and navigate back
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirm) return;
    }
    router.push("/templates");
  }, [hasUnsavedChanges, router]);

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
  }, [isEditorReady, isSaving, handleSave]);

  return {
    // Refs
    editorRef,

    // State
    templateName,
    setTemplateName,
    nameError,
    setNameError,
    isEditorReady,
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    variables,
    setVariables,
    detectedVariables,
    setDetectedVariables,

    // Methods
    handleEditorReady,
    handleSave,
    handleCancel,
    initializeVariables,
  };
}
