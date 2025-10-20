/**
 * Template Creation Page - Create New Email Template
 *
 * This page provides the UI for creating new email templates using react-email-editor.
 * Supports both creating from scratch and importing Unlayer JSON designs.
 *
 * Query Parameters:
 * - imported: Set to "true" when redirected from template import dialog
 *
 * When imported=true, the component retrieves the imported design from
 * sessionStorage (set by TemplateImportDialog) and loads it into the editor.
 *
 * @see components/pages/template-page.tsx - Unified template editor component
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TemplatePage } from "@/components/pages/template-page";
import { type UnlayerDesign } from "@/lib/utils/unlayer-validation";

export default function NewTemplatePage() {
  const searchParams = useSearchParams();
  const [importedDesign, setImportedDesign] = useState<UnlayerDesign | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Retrieve imported design from sessionStorage if available
  useEffect(() => {
    const isImported = searchParams.get("imported") === "true";

    if (isImported) {
      try {
        const storedDesign = sessionStorage.getItem("importedDesign");
        if (storedDesign) {
          const design = JSON.parse(storedDesign) as UnlayerDesign;
          setImportedDesign(design);

          // Clear sessionStorage after retrieving
          sessionStorage.removeItem("importedDesign");
        }
      } catch (error) {
        console.error("Error retrieving imported design:", error);
      }
    }

    setIsInitialized(true);
  }, [searchParams]);

  if (!isInitialized) {
    return null; // Show nothing while initializing
  }

  return <TemplatePage mode="create" initialDesign={importedDesign} />;
}
