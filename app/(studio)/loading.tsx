/**
 * @fileoverview Loading state component for studio pages
 *
 * Displays placeholder skeleton loaders while studio page content is being
 * fetched. Uses shadcn/ui Skeleton component for consistent loading UI
 * across all studio routes.
 *
 * Loading States Supported:
 * - Dashboard with header and content cards
 * - Templates list with multiple placeholder cards
 * - Template detail pages with form fields
 *
 * Features:
 * - Responsive grid layout matching final content
 * - Smooth animation during loading
 * - Maintains layout stability (no cumulative layout shift)
 * - Accessible skeleton components
 *
 * @example
 * // Used automatically by Next.js for loading.tsx routes
 * // Displays while StudioHome or other pages are being rendered
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function StudioLoading() {
  return (
    <div className="p-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Content skeleton - multiple cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/4" />
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
