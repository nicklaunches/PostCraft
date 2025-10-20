"use client";

/**
 * Template Import Dialog Component
 *
 * Modal dialog for importing Unlayer JSON templates via two methods:
 * 1. File upload (.json files)
 * 2. Textarea paste (direct JSON text)
 *
 * Features:
 * - Accepts JSON from file upload or textarea paste
 * - Prioritizes file upload when both are provided
 * - Validates JSON structure and file size before import
 * - Shows loading state during processing
 * - Displays clear error messages for validation failures
 * - Disables controls during processing to prevent concurrent imports
 * - Redirects to editor on successful import
 *
 * @component
 */

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  parseAndValidateJSON,
  validateFile,
  validateTextareaContent,
  determineImportSource,
  VALIDATION_ERRORS,
  type UnlayerDesign,
} from "@/lib/utils/unlayer-validation";

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: (design: UnlayerDesign) => void;
}

export function TemplateImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: TemplateImportDialogProps) {
  const router = useRouter();

  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textareaContent, setTextareaContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for form controls
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle file input change - validate file and update state
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file before accepting it
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
  }, []);

  /**
   * Handle textarea paste - validate content size
   */
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setTextareaContent(content);
    setError(null);

    // Validate content size as user types
    if (content.length > 0) {
      const validation = validateTextareaContent(content);
      if (!validation.valid) {
        setError(validation.error);
      }
    }
  }, []);

  /**
   * Process and validate the selected import source (file or textarea)
   */
  const handleImport = useCallback(async () => {
    setError(null);

    // Determine which source to use (file takes priority)
    const { source, content } = determineImportSource(selectedFile, textareaContent);

    // Check if we have any input
    if (!content) {
      setError(VALIDATION_ERRORS.EMPTY_INPUT);
      return;
    }

    setIsProcessing(true);

    try {
      let jsonString: string;

      // Read file content if source is file
      if (source === "file" && content instanceof File) {
        jsonString = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === "string") {
              resolve(text);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(content);
        });
      } else {
        // Content is already a string (textarea)
        jsonString = content as string;
      }

      // Parse and validate the JSON
      const result = parseAndValidateJSON(jsonString);
      if (!result.valid) {
        setError(result.error);
        setIsProcessing(false);
        return;
      }

      const design = result.design as UnlayerDesign;

      // If callback provided (editor context), use it directly
      if (onImportSuccess) {
        onImportSuccess(design);
        // Clear form on success
        setSelectedFile(null);
        setTextareaContent("");
        onOpenChange(false);
      } else {
        // Otherwise, store design in sessionStorage and redirect (templates list context)
        sessionStorage.setItem("importedDesign", JSON.stringify(design));
        // Redirect to editor with imported design
        router.push("/templates/new?imported=true");
        // Clear form on success
        setSelectedFile(null);
        setTextareaContent("");
        onOpenChange(false);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, textareaContent, router, onOpenChange, onImportSuccess]);

  /**
   * Reset form and close dialog
   */
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setTextareaContent("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Import Template
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload a JSON file or paste JSON content to import an Unlayer template
          </p>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Content Container */}
        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload JSON File
            </label>
            <div className="relative">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="block w-full cursor-pointer text-sm text-gray-500"
              />
              {selectedFile && (
                <p className="mt-1 text-xs text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          {/* Textarea Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Paste JSON
            </label>
            <textarea
              ref={textareaRef}
              value={textareaContent}
              onChange={handleTextareaChange}
              disabled={isProcessing}
              placeholder="Paste your Unlayer JSON here..."
              rows={6}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <Button
            onClick={handleClose}
            disabled={isProcessing}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? "Importing..." : "Import"}
          </Button>
        </div>

        {/* Loading Indicator Text */}
        {isProcessing && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Processing template...
          </p>
        )}
      </div>
    </Dialog>
  );
}
