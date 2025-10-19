"use client";

import React, { useRef, useEffect } from "react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";

interface TemplateEditorProps {
  onReady?: () => void;
  onLoad?: () => void;
  initialDesign?: object | null;
}

export const TemplateEditor = React.forwardRef<EditorRef, TemplateEditorProps>(
  ({ onReady, onLoad, initialDesign }, ref) => {
    const editorRef = useRef<EditorRef>(null);

    // Expose the editor ref to parent
    useEffect(() => {
      if (ref && editorRef.current) {
        if (typeof ref === "function") {
          ref(editorRef.current);
        } else {
          ref.current = editorRef.current;
        }
      }
    }, [ref]);

    const handleReady = () => {
      if (onReady) {
        onReady();
      }

      // Load initial design if provided
      if (initialDesign && editorRef.current?.editor) {
        editorRef.current.editor.loadDesign(initialDesign as any);
      }

      if (onLoad) {
        onLoad();
      }
    };

    const editorOptions: EmailEditorProps["options"] = {
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
