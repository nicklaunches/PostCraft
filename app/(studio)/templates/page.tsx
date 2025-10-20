/**
 * @fileoverview Template list page for viewing and managing email templates
 *
 * Server component that displays a paginated list of all email templates.
 * Implements US2 (View Templates) with:
 *
 * Features:
 * - Paginated template list (20 items per page by default)
 * - Navigation header with title, "Import Template" button, and "Create Template" button
 * - Responsive grid layout using shadcn/ui Card components
 * - Loading skeleton state using Suspense boundary
 * - Empty state with call-to-action when no templates exist
 * - Quick action buttons: Edit, Export, Delete (templates coming in later phases)
 *
 * Routing:
 * - Page URL: /templates
 * - Create button: /templates/new
 * - Edit button: /templates/{id}/edit
 *
 * Query Parameters:
 * - page: Current page number (default: "1")
 * - pageSize: Items per page (default: "20", max: 100)
 *
 * @example
 * // Template list page URL
 * GET /templates
 * GET /templates?page=2&pageSize=10
 *
 * @see {@link /components/template-list.tsx} TemplateList client component
 * @see {@link /app/api/templates/route.ts} GET /api/templates endpoint
 */

import { Suspense } from "react";
import { TemplateList } from "@/components/template-list";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplatesHeaderClient } from "@/components/templates-header-client";

export const metadata = {
  title: "Templates - PostCraft Studio",
  description: "Manage your email templates",
};

interface TemplatesPageProps {
  searchParams: { page?: string; pageSize?: string };
}

export default async function TemplatesPage({
  searchParams,
}: TemplatesPageProps) {
  const page = searchParams.page || "1";
  const pageSize = searchParams.pageSize || "20";

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      <TemplatesHeaderClient />

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        }
      >
        <TemplateList page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
