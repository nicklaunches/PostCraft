/**
 * @fileoverview Template list client component for displaying paginated templates
 *
 * Client component that fetches and displays email templates from the API.
 * Implements US2 (View Templates) with comprehensive state management for:
 *
 * Features:
 * - Fetch templates from GET /api/templates with pagination
 * - Display template grid with card-based UI (shadcn/ui Card)
 * - Loading skeleton state during fetch
 * - Error state with retry button
 * - Empty state with create template call-to-action
 * - Pagination controls (shadcn/ui Pagination)
 * - Quick action buttons: Edit, Export, Delete
 * - Keyboard navigation: Enter/Space to edit, arrow keys for navigation
 * - Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
 *
 * Template Card Features:
 * - Template name and metadata (created/updated dates)
 * - Edit button linking to /templates/{id}/edit
 * - Export button placeholder (Phase 10)
 * - Delete button placeholder (Phase 8)
 * - Keyboard focusable with tabIndex={0}
 *
 * @example
 * // Usage in server component
 * import { TemplateList } from '@/components/template-list';
 * <TemplateList page="1" pageSize="20" />
 *
 * @see {@link /app/api/templates/route.ts} GET /api/templates endpoint
 * @see {@link /app/(studio)/templates/page.tsx} Template list page
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { AlertCircle, FileText, Plus, Edit, Trash2, Download } from 'lucide-react'
import type { ListTemplatesResponse } from '@/specs/001-local-studio-dashboard/contracts/api-templates'

interface TemplateListProps {
  page: string
  pageSize: string
}

/**
 * TemplateList component
 *
 * Client component for displaying paginated email templates.
 * Manages loading, error, empty, and success states.
 *
 * @param props - Component props
 * @param props.page - Current page number (string, will be parsed to int)
 * @param props.pageSize - Items per page (string, will be parsed to int)
 *
 * @returns React component with template grid and pagination
 *
 * @example
 * <TemplateList page="1" pageSize="20" />
 *
 * States:
 * - Loading: Shows animated skeleton loaders
 * - Error: Shows error alert with retry button
 * - Empty: Shows empty state with create template button
 * - Success: Shows template grid with pagination
 */
export function TemplateList({ page, pageSize }: TemplateListProps) {
  const router = useRouter()
  const [data, setData] = useState<ListTemplatesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetTemplate, setDeleteTargetTemplate] = useState<{ id: number; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  /**
   * Fetches templates from the API
   *
   * @returns Promise that resolves when fetch completes
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/templates?page=${page}&pageSize=${pageSize}`)

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  /**
   * Handles template deletion with error handling and confirmation
   *
   * @returns Promise that resolves when deletion completes
   */
  const handleDeleteTemplate = useCallback(async () => {
    if (!deleteTargetTemplate) return

    try {
      setIsDeleting(true)
      setDeleteError(null)
      const response = await fetch(`/api/templates/${deleteTargetTemplate.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete template')
      }

      // Success - show toast and refresh list
      setToast({
        type: 'success',
        message: `Template '${deleteTargetTemplate.name}' deleted successfully`,
      })
      setDeleteDialogOpen(false)
      setDeleteTargetTemplate(null)

      // Refresh the template list
      fetchTemplates()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setDeleteError(errorMsg)
      setToast({
        type: 'error',
        message: errorMsg,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTargetTemplate, fetchTemplates])

  /**
   * Opens delete confirmation dialog
   *
   * @param templateId - ID of template to delete
   * @param templateName - Name of template to delete
   */
  const openDeleteDialog = useCallback((templateId: number, templateName: string) => {
    setDeleteTargetTemplate({ id: templateId, name: templateName })
    setDeleteDialogOpen(true)
    setDeleteError(null)
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchTemplates}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Loading state
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  // Empty state
  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No templates yet</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Create your first email template to get started with PostCraft
        </p>
        <Link href="/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Template
          </Button>
        </Link>
      </div>
    )
  }

  // Template grid
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {data.items.length} of {data.pagination.totalCount} templates
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((template) => (
          <Card
            key={template.id}
            className="group hover:shadow-lg transition-shadow cursor-pointer"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push(`/templates/${template.id}/edit`)
              }
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{template.name}</span>
              </CardTitle>
              <CardDescription>
                Updated {new Date(template.updatedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/templates/${template.id}/edit`)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  // Export functionality will be implemented in Phase 10
                  alert('Export feature coming soon!')
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openDeleteDialog(template.id, template.name)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          onKeyDown={(e: React.KeyboardEvent) => {
            // Support Enter key to confirm delete when focus is on delete button
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault()
              handleDeleteTemplate()
            }
            // Escape key already handled by Dialog component
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "{deleteTargetTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{deleteError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTemplate()}
                  disabled={isDeleting}
                  aria-label="Retry deletion"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteTargetTemplate(null)
                setDeleteError(null)
              }}
              disabled={isDeleting}
              aria-label="Cancel delete operation (Escape key)"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteTemplate()}
              disabled={isDeleting}
              aria-label="Confirm delete operation (Enter key)"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleDeleteTemplate()
                }
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2" style={{
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
        }}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={(newPage) => {
            router.push(`/templates?page=${newPage}&pageSize=${pageSize}`)
          }}
        />
      )}
    </div>
  )
}
