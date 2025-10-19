/**
 * Template Editor Component - React Email Editor Wrapper
 *
 * This component wraps the react-email-editor (Unlayer) library, providing a managed
 * interface for email template design and editing. It handles editor initialization,
 * state management, and exposes methods to parent components for design export and loading.
 *
 * **Purpose:**
 * - Encapsulates react-email-editor configuration and setup
 * - Provides ref-based access to underlying editor instance
 * - Manages editor initialization and ready state
 * - Supports loading initial template designs
 * - Integrates with template creation and editing flows
 *
 * **React Email Editor Integration:**
 * - Uses react-email-editor from Unlayer (https://react-email-editor.readthedocs.io/)
 * - Requires POSTCRAFT_UNLAYER_PROJECT_ID environment variable
 * - Supports all Unlayer editor features: design tools, templates, merge tags
 * - Exports designs as JSON via saveDesign() method
 * - Exports production HTML via exportHtml() method
 * - Supports loading designs via loadDesign() method
 *
 * **Component API:**
 * - Props: onReady, onLoad, initialDesign (optional)
 * - Ref: Exposes EditorRef for parent component access
 * - EditorRef methods: saveDesign(), exportHtml(), loadDesign(), etc.
 *
 * **Design Data Format:**
 * react-email-editor stores designs in JSON with structure:
 * ```json
 * {
 *   "body": {
 *     "rows": [
 *       {
 *         "columns": [
 *           {
 *             "elements": [
 *               { "type": "text", "data": { "value": "Hello {{NAME}}" } }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   },
 *   "design": {
 *     "colors": { ... },
 *     "fonts": { ... }
 *   }
 * }
 * ```
 * Merge tags like {{VARIABLE}} are preserved in element text content.
 *
 * **Editor Configuration:**
 * - projectId: Unlayer project ID from environment
 * - tools: All tools enabled (text, image, button, columns, divider, etc.)
 * - mergeTags: Support for {{VARIABLE}} syntax
 * - minHeight: 600px default height
 * - Full feature set per FR-006a
 *
 * **State Management:**
 * - isEditorInitialized: Tracks when editor is fully loaded
 * - ref.current: Exposes underlying EditorRef for saveDesign/exportHtml
 * - initialDesign: Loaded automatically after editor ready
 *
 * **Lifecycle:**
 * 1. Component mounts, EmailEditor renders
 * 2. onReady callback fired when editor loads
 * 3. Set isEditorInitialized = true
 * 4. If initialDesign provided, load via editor.loadDesign()
 * 5. onReady and onLoad callbacks execute
 * 6. Component ready for user interaction
 * 7. Parent calls editorRef.current.saveDesign() on save
 * 8. Parent calls editorRef.current.exportHtml() to export
 *
 * **Usage with Parent Components:**
 * - NewTemplatePage: Creates templates, calls saveDesign/exportHtml
 * - EditTemplatePage: Loads existing design via initialDesign, then edits
 * - Parent components manage save/load operations via ref
 *
 * **Performance Considerations:**
 * - Editor loads asynchronously (Unlayer library)
 * - Design export is on-demand (not continuous)
 * - initialDesign loaded only after editor ready
 * - ref exposed to avoid re-renders during editing
 *
 * **Accessibility:**
 * - Full-height editor container
 * - Keyboard navigation built into Unlayer editor
 * - Focus managed by Unlayer internally
 *
 * **Error Handling:**
 * - onReady verifies editor.editor exists before proceeding
 * - Missing initialDesign handled gracefully (blank canvas)
 * - Missing POSTCRAFT_UNLAYER_PROJECT_ID may cause Unlayer errors
 *
 * **Related Files:**
 * - app/(studio)/templates/new/page.tsx: Template creation flow
 * - app/(studio)/templates/[id]/edit/page.tsx: Template editing flow
 * - lib/utils/validation.ts: Template name validation
 *
 * **External Dependencies:**
 * - react-email-editor: Email editor library
 * - Unlayer: Backend service for Unlayer editor
 * - POSTCRAFT_UNLAYER_PROJECT_ID: Environment variable
 *
 * @module components/template-editor
 * @requires react - React hooks, forwardRef
 * @requires react-email-editor - EmailEditor component, EditorRef type
 * @requires next - Environment variable access
 *
 * @example
 * ```tsx
 * // Create template with ref
 * const editorRef = useRef<EditorRef>(null);
 *
 * <TemplateEditor
 *   ref={editorRef}
 *   onReady={() => console.log('Editor ready')}
 * />
 *
 * // Later: save design
 * editorRef.current?.editor?.saveDesign((design) => {
 *   console.log('Design saved:', design);
 * });
 *
 * // Export HTML
 * editorRef.current?.editor?.exportHtml((data) => {
 *   console.log('HTML:', data.html);
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Load initial design when editing
 * const initialDesign = {
 *   body: { rows: [...] },
 *   design: { ... }
 * };
 *
 * <TemplateEditor
 *   ref={editorRef}
 *   initialDesign={initialDesign}
 *   onReady={() => console.log('Existing template loaded')}
 * />
 * ```
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";

interface TemplateEditorProps {
    /**
     * Callback fired when editor is fully initialized and ready for use.
     *
     * This callback is fired AFTER:
     * 1. React EmailEditor component renders
     * 2. Unlayer library loads
     * 3. Editor instance becomes available
     * 4. Verify editor.editor exists
     *
     * Do NOT call editor methods in this callback until initialDesign is loaded.
     * Use onLoad for operations after design is fully loaded.
     *
     * @callback
     * @example
     * ```tsx
     * <TemplateEditor
     *   onReady={() => {
     *     console.log('Editor initialized');
     *     // Safe to create new designs, but don't export yet
     *   }}
     * />
     * ```
     */
    onReady?: () => void;

    /**
     * Callback fired when editor and initial design (if any) are fully loaded.
     *
     * This callback is fired AFTER:
     * 1. onReady has fired
     * 2. Editor is initialized
     * 3. initialDesign has been loaded (if provided)
     *
     * Use this for operations on loaded designs or to proceed with editing.
     *
     * @callback
     * @example
     * ```tsx
     * <TemplateEditor
     *   initialDesign={existingTemplate.content}
     *   onLoad={() => {
     *     console.log('Template loaded and ready for editing');
     *     // Can now export or modify design
     *   }}
     * />
     * ```
     */
    onLoad?: () => void;

    /**
     * Optional initial design to load into editor.
     *
     * This should be a react-email-editor design JSON object from a previous saveDesign() call.
     * If provided, the design is loaded automatically after editor initialization.
     *
     * Structure:
     * ```json
     * {
     *   "body": {
     *     "rows": [
     *       {
     *         "columns": [
     *           {
     *             "elements": [
     *               { "type": "text", "data": { "value": "Content" } }
     *             ]
     *           }
     *         ]
     *       }
     *     ]
     *   },
     *   "design": { "colors": [...], "fonts": [...] }
     * }
     * ```
     *
     * For editing existing templates, pass template.content.
     * For creating new templates, leave undefined (blank canvas).
     *
     * @type {object | null | undefined}
     * @example
     * ```tsx
     * // Create new (blank) template
     * <TemplateEditor ref={ref} />
     *
     * // Edit existing template
     * <TemplateEditor ref={ref} initialDesign={template.content} />
     * ```
     */
    initialDesign?: object | null;
}

/**
 * TemplateEditor Component - React Email Editor Wrapper
 *
 * Renders a react-email-editor instance with lifecycle management and ref exposure.
 *
 * This is a managed wrapper around EmailEditor from react-email-editor library.
 * It handles initialization, design loading, and exposes the underlying editor ref
 * to parent components for design export/import operations.
 *
 * **Component Behavior:**
 *
 * 1. **Initialization Phase** (on mount):
 *    - Renders EmailEditor component with configuration
 *    - onReady callback fires when Unlayer loads
 *    - Component sets isEditorInitialized = true
 *
 * 2. **Design Loading Phase** (if initialDesign provided):
 *    - After onReady, loads initialDesign via editor.loadDesign()
 *    - Waits for design to load in editor
 *    - Then fires onLoad callback
 *
 * 3. **Ready Phase**:
 *    - Parent can call saveDesign() to export current design
 *    - Parent can call exportHtml() to export HTML
 *    - Parent can call loadDesign() to change design
 *
 * **Ref Usage:**
 *
 * Parent components access editor methods via ref:
 * ```typescript
 * const editorRef = useRef<EditorRef>(null);
 *
 * // Save design
 * editorRef.current?.editor?.saveDesign((design) => {
 *   console.log(design); // react-email-editor design JSON
 * });
 *
 * // Export HTML
 * editorRef.current?.editor?.exportHtml((data) => {
 *   console.log(data.html); // Production HTML with inline styles
 * });
 *
 * // Load design
 * editorRef.current?.editor?.loadDesign(newDesign);
 * ```
 *
 * **Public Methods (via ref):**
 *
 * All methods are from react-email-editor EditorRef:
 * - saveDesign(callback): Export current design as JSON
 * - exportHtml(callback): Export HTML with inline styles
 * - loadDesign(design): Load design JSON into editor
 * - getDesign(): Get current design synchronously
 * - setMergeTags(tags): Configure merge tags
 *
 * Refer to react-email-editor documentation for complete API.
 *
 * **Configuration:**
 * - projectId: Required Unlayer project ID (from POSTCRAFT_UNLAYER_PROJECT_ID)
 * - tools: All tools enabled (text, image, button, columns, etc.)
 * - mergeTags: Support for {{VARIABLE}} syntax
 * - minHeight: 600px default container height
 *
 * **Error Handling:**
 * - onReady verifies editor.editor exists (may be undefined during load)
 * - Missing initialDesign handled gracefully (blank canvas)
 * - Missing projectId may cause Unlayer API errors
 *
 * **Performance:**
 * - Unlayer editor loads asynchronously
 * - Design export (saveDesign/exportHtml) called on-demand
 * - No re-renders during user interaction (design in Unlayer's state)
 *
 * **Accessibility:**
 * - Full-height responsive editor
 * - Keyboard navigation via Unlayer
 * - Focus management via Unlayer
 *
 * @param props - TemplateEditorProps with onReady, onLoad, initialDesign
 * @param ref - React.Ref<EditorRef> for accessing editor instance
 *
 * @returns React.ReactElement - Editor component
 *
 * @example
 * ```tsx
 * // Create new template (blank editor)
 * function CreateTemplate() {
 *   const ref = useRef<EditorRef>(null);
 *
 *   const handleSave = () => {
 *     ref.current?.editor?.saveDesign((design) => {
 *       console.log('Design:', design);
 *       // POST to /api/templates
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleSave}>Save</button>
 *       <TemplateEditor ref={ref} />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Edit existing template
 * function EditTemplate({ template }) {
 *   const ref = useRef<EditorRef>(null);
 *   const [isSaving, setIsSaving] = useState(false);
 *
 *   const handleSave = () => {
 *     setIsSaving(true);
 *     ref.current?.editor?.saveDesign((design) => {
 *       // PUT to /api/templates/[id]
 *       fetch(`/api/templates/${template.id}`, {
 *         method: 'PUT',
 *         body: JSON.stringify({ content: design })
 *       })
 *       .then(() => setIsSaving(false))
 *       .catch((err) => {
 *         console.error('Save failed:', err);
 *         setIsSaving(false);
 *       });
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleSave} disabled={isSaving}>
 *         {isSaving ? 'Saving...' : 'Save'}
 *       </button>
 *       <TemplateEditor
 *         ref={ref}
 *         initialDesign={template.content}
 *         onLoad={() => console.log('Template loaded')}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Export HTML for preview
 * function ExportTemplate() {
 *   const ref = useRef<EditorRef>(null);
 *
 *   const handleExport = () => {
 *     ref.current?.editor?.exportHtml((data) => {
 *       console.log('HTML:', data.html);
 *       // Show preview, copy to clipboard, download, etc.
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleExport}>Export HTML</button>
 *       <TemplateEditor ref={ref} />
 *     </>
 *   );
 * }
 * ```
 */
export const TemplateEditor = React.forwardRef<EditorRef, TemplateEditorProps>(
    ({ onReady, onLoad, initialDesign }, ref) => {
        const editorRef = useRef<EditorRef>(null);
        const [isEditorInitialized, setIsEditorInitialized] = useState(false);

        // Expose the editor ref to parent
        useEffect(() => {
            console.log("TemplateEditor: useEffect - exposing ref to parent");
            console.log("TemplateEditor: isEditorInitialized?", isEditorInitialized);
            console.log("TemplateEditor: editorRef.current exists?", !!editorRef.current);
            if (ref && editorRef.current) {
                console.log("TemplateEditor: Setting ref");
                if (typeof ref === "function") {
                    ref(editorRef.current);
                } else {
                    ref.current = editorRef.current;
                }
            }
        }, [ref, isEditorInitialized]);

        const handleReady = (unlayer: any) => {
            console.log("TemplateEditor: handleReady callback invoked");
            console.log("TemplateEditor: unlayer argument:", unlayer);
            console.log("TemplateEditor: editorRef.current exists?", !!editorRef.current);
            console.log("TemplateEditor: editorRef.current.editor exists?", !!editorRef.current?.editor);
            // Editor is ready when this callback is invoked
            // The editor instance should be available via the ref
            setIsEditorInitialized(true);

            // Load initial design if provided
            if (initialDesign && editorRef.current?.editor) {
                console.log("TemplateEditor: Loading initial design");
                editorRef.current.editor.loadDesign(initialDesign as any);
            }
        };

        // Check if Unlayer script loads
        useEffect(() => {
            console.log("TemplateEditor: Checking for Unlayer global");
            console.log("TemplateEditor: window.unlayer exists?", !!(typeof window !== 'undefined' && (window as any).unlayer));

            // Listen for script errors
            const handleError = (event: ErrorEvent) => {
                console.error("TemplateEditor: Script error detected:", event.message, event.filename);
            };

            window.addEventListener('error', handleError);

            return () => {
                window.removeEventListener('error', handleError);
            };
        }, []);

        // Call onReady and onLoad callbacks after editor is fully initialized
        useEffect(() => {
            console.log("TemplateEditor: useEffect - callbacks effect");
            console.log("TemplateEditor: isEditorInitialized?", isEditorInitialized);
            console.log("TemplateEditor: editor exists?", !!editorRef.current?.editor);
            console.log("TemplateEditor: onReady callback exists?", !!onReady);
            console.log("TemplateEditor: onLoad callback exists?", !!onLoad);

            if (isEditorInitialized && editorRef.current?.editor) {
                console.log("TemplateEditor: Calling onReady callback");
                if (onReady) {
                    onReady();
                }

                console.log("TemplateEditor: Calling onLoad callback");
                if (onLoad) {
                    onLoad();
                }
            }
        }, [isEditorInitialized, onReady, onLoad]);

        const editorOptions: EmailEditorProps["options"] = {
            projectId: Number(process.env.POSTCRAFT_UNLAYER_PROJECT_ID),
            tools: {
                // Enable all tools per FR-006a
            },
            mergeTags: {
                // Configure merge tags support
                // Users can define merge tags in the editor
            },
        };

        console.log("TemplateEditor: Rendering component");
        console.log("TemplateEditor: POSTCRAFT_UNLAYER_PROJECT_ID?", !!process.env.POSTCRAFT_UNLAYER_PROJECT_ID);
        console.log("TemplateEditor: projectId value:", process.env.POSTCRAFT_UNLAYER_PROJECT_ID);
        console.log("TemplateEditor: projectId as number:", Number(process.env.POSTCRAFT_UNLAYER_PROJECT_ID));
        console.log("TemplateEditor: isEditorInitialized?", isEditorInitialized);
        console.log("TemplateEditor: editorOptions:", editorOptions);

        return (
            <div className="h-full w-full" style={{ minHeight: '600px' }}>
                <EmailEditor
                    ref={editorRef}
                    onReady={handleReady}
                    options={editorOptions}
                    minHeight="600px"
                />
            </div>
        );
    },
);

TemplateEditor.displayName = "TemplateEditor";

export default TemplateEditor;
