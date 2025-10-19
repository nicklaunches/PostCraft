/**
 * @fileoverview Template list page for viewing and managing email templates
 *
 * Server component that displays a paginated list of all email templates.
 * Implements US2 (View Templates) with:
 *
 * Features:
 * - Paginated template list (20 items per page by default)
 * - Navigation header with title and "Create Template" button
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
import Link from "next/link";
import { TemplateList } from "@/components/template-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your email templates
          </p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Link>
      </div>

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
