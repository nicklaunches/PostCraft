"use client";

/**
 * Templates Header Client Component
 *
 * Client-side wrapper for the templates page header that manages
 * the import dialog state and provides action buttons.
 *
 * @component
 */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TemplateImportDialog } from "@/components/template-import-dialog";
import { Plus, Upload } from "lucide-react";

export function TemplatesHeaderClient() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your email templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Template
          </Button>
          <Link href="/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </Link>
        </div>
      </div>

      <TemplateImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </>
  );
}
