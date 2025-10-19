"use client";

import React, { useRef, useEffect, useState } from "react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";

interface TemplateEditorProps {
  onReady?: () => void;
  onLoad?: () => void;
  initialDesign?: object | null;
}

export const TemplateEditor = React.forwardRef<EditorRef, TemplateEditorProps>(
  ({ onReady, onLoad, initialDesign }, ref) => {
    const editorRef = useRef<EditorRef>(null);
    const [isEditorInitialized, setIsEditorInitialized] = useState(false);

    // Expose the editor ref to parent
    useEffect(() => {
      console.log("[TemplateEditor] Ref effect running", {
        hasRef: !!ref,
        hasEditorRef: !!editorRef.current,
        hasEditor: !!editorRef.current?.editor,
      });
      if (ref && editorRef.current) {
        console.log("[TemplateEditor] Exposing ref to parent", {
          editorRefCurrent: editorRef.current,
          hasEditorProperty: !!editorRef.current.editor,
        });
        if (typeof ref === "function") {
          ref(editorRef.current);
        } else {
          ref.current = editorRef.current;
        }
      }
    }, [ref, isEditorInitialized]);

    const handleReady = () => {
      console.log("[TemplateEditor] EmailEditor onReady fired", {
        hasEditorRef: !!editorRef.current,
        hasEditor: !!editorRef.current?.editor,
      });
      // Verify editor is truly ready before notifying parent
      if (!editorRef.current?.editor) {
        console.warn("[TemplateEditor] Editor reference not available yet");
        return;
      }

      console.log("[TemplateEditor] Setting isEditorInitialized = true");
      setIsEditorInitialized(true);

      // Load initial design if provided
      if (initialDesign && editorRef.current?.editor) {
        console.log("[TemplateEditor] Loading initial design");
        editorRef.current.editor.loadDesign(initialDesign as any);
      }
    };

    // Call onReady and onLoad callbacks after editor is fully initialized
    useEffect(() => {
      console.log("[TemplateEditor] Init effect running", {
        isEditorInitialized,
        hasEditor: !!editorRef.current?.editor,
        hasOnReady: !!onReady,
        hasOnLoad: !!onLoad,
      });
      if (isEditorInitialized && editorRef.current?.editor) {
        console.log("[TemplateEditor] Calling onReady and onLoad callbacks");
        if (onReady) {
          console.log("[TemplateEditor] Calling onReady");
          onReady();
        }

        if (onLoad) {
          console.log("[TemplateEditor] Calling onLoad");
          onLoad();
        }
      }
    }, [isEditorInitialized, onReady, onLoad]);

    const editorOptions: EmailEditorProps["options"] = {
      projectId: 280595,
      appearance: {
        theme: "light",
      },
      tools: {
        // Enable all tools per FR-006a
      },
      mergeTags: {
        // Configure merge tags support
        // Users can define merge tags in the editor
      },
    };

    return (
      <div className="h-full w-full">
        <EmailEditor
          ref={editorRef}
          onReady={handleReady}
          options={editorOptions}
          minHeight="600px"
        />
      </div>
    );
  }
);

TemplateEditor.displayName = "TemplateEditor";

export default TemplateEditor;
