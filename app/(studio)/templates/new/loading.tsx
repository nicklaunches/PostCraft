/**
 * @fileoverview Loading state for new template creation page
 *
 * Displays skeleton placeholders while the template editor is being initialized.
 * Shows a layout matching the template editor interface for creating new templates.
 *
 * Features:
 * - Skeleton for template name input field
 * - Skeleton for editor area
 * - Responsive layout matching final UI
 * - Smooth animation transitions
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function NewTemplateLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header - Title and Save button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Template name input */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Editor area - main content */}
      <div className="flex-1 rounded-lg border border-gray-200">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>

      {/* Variable manager section */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-[150px]" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
