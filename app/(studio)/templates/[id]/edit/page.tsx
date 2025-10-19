/**
 * @fileoverview Template editing page component for the PostCraft local studio.
 *
 * Provides a full-featured email template editor allowing users to modify existing
 * template designs using react-email-editor and sync changes back to the database.
 * Now refactored to use the unified TemplatePage component.
 *
 * @see components/pages/template-page.tsx - Unified template editor component
 * @see app/api/templates/[id]/route.ts - PUT endpoint for saving templates
 * @see lib/db/schema.ts - Template and TemplateVariable database schemas
 */
"use client";

import { TemplatePage } from "@/components/pages/template-page";

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  return <TemplatePage mode="edit" templateId={params.id} />;
}
