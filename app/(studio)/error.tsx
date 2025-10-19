"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error("Studio error:", error);
  }, [error]);

  return (
    <div className="p-8">
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription>
          {error.message || "An unexpected error occurred while loading the studio."}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What can you do?
          </h2>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>Try refreshing the page</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>Check your database connection</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-3">•</span>
              <span>Check the server logs for more details</span>
            </li>
          </ul>
          <div className="flex gap-3">
            <Button onClick={reset} variant="primary">
              Try Again
            </Button>
            <Link href="/">
              <Button variant="secondary">
                Go Home
              </Button>
            </Link>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && error.digest && (
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-mono">Error ID: {error.digest}</p>
          </div>
        )}
      </div>
    </div>
  );
}
