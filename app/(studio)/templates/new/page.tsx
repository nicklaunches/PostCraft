/**
 * Template Creation Page - Create New Email Template
 *
 * This page provides the UI for creating new email templates using react-email-editor.
 * Now refactored to use the unified TemplatePage component.
 *
 * @see components/pages/template-page.tsx - Unified template editor component
 */

"use client";

import { TemplatePage } from "@/components/pages/template-page";

export default function NewTemplatePage() {
    return <TemplatePage mode="create" />;
}
