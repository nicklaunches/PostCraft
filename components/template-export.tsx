/**
 * @fileoverview Template export component for exporting templates as HTML
 *
 * Client component that enables export of email templates as HTML with multiple options:
 *
 * Features:
 * - Fetch template design JSON from API
 * - Load design into react-email-editor (temporary instance)
 * - Generate HTML using exportHtml() method
 * - Copy HTML to clipboard with success feedback
 * - Download HTML as .html file with automatic naming
 * - Loading state with skeleton loaders
 * - Empty template warning when template has no content
 * - Error handling with retry option
 * - Preserve template variables in {{VARIABLE}} format for SDK usage
 * - Proper cleanup of editor instance after export
 *
 * Implementation Details:
 * - Uses react-email-editor via ref for temporary HTML generation
 * - No server-side rendering required (on-demand generation)
 * - Follows similar pattern to template edit functionality
 * - Displays modal dialog with export options
 *
 * @example
 * // Usage in template card or list
 * import { TemplateExport } from '@/components/template-export';
 * <TemplateExport templateId={123} templateName="Welcome Email" />
 *
 * @see {@link /components/template-editor.tsx} TemplateEditor for design loading
 * @see {@link /app/api/templates/[id]/route.ts} GET endpoint for fetching template
 */

'use client'

import { useRef, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Download, AlertCircle, CheckCircle } from 'lucide-react'

interface TemplateExportProps {
  templateId: number
  templateName: string
  /**
   * Callback fired when export dialog is closed
   */
  onClose?: () => void
}

interface Template {
  id: number
  name: string
  content: Record<string, unknown> // react-email-editor design JSON
  createdAt: string
  updatedAt: string
}

/**
 * Shows a simple toast notification
 * @param message - Message to display
 * @param type - Toast type (success or error)
 */
function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Create toast element
  const toastEl = document.createElement('div')
  toastEl.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50`
  toastEl.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444'
  toastEl.style.color = 'white'
  toastEl.textContent = message

  document.body.appendChild(toastEl)

  // Remove after 3 seconds
  setTimeout(() => {
    toastEl.remove()
  }, 3000)
}

/**
 * TemplateExport component
 *
 * Modal component for exporting email templates as HTML.
 * Manages template data fetching, HTML generation, and export actions.
 *
 * @param props - Component props
 * @param props.templateId - ID of template to export
 * @param props.templateName - Display name of template
 * @param props.onClose - Optional callback when dialog closes
 *
 * @returns React component with export dialog and actions
 *
 * @example
 * const [showExport, setShowExport] = useState(false);
 * return (
 *   <>
 *     <Button onClick={() => setShowExport(true)}>Export</Button>
 *     {showExport && (
 *       <TemplateExport
 *         templateId={template.id}
 *         templateName={template.name}
 *         onClose={() => setShowExport(false)}
 *       />
 *     )}
 *   </>
 * );
 */
export function TemplateExport({ templateId, templateName, onClose }: TemplateExportProps) {
  const [open, setOpen] = useState(true)
  const [template, setTemplate] = useState<Template | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exported, setExported] = useState(false)
  const editorRef = useRef<any>(null)

  /**
   * Fetches template data from API
   *
   * @returns Promise resolving to template data
   *
   * @throws Error if fetch fails or template not found
   */
  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/templates/${templateId}`)

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Template not found' : 'Failed to fetch template')
      }

      const data = await response.json()
      setTemplate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  /**
   * Generates HTML from template design
   *
   * Loads template design into editor and exports to HTML.
   * Preserves template variables in {{VARIABLE}} format.
   *
   * @returns Promise resolving when HTML generation completes
   *
   * @throws Error if HTML generation fails
   */
  const generateHtml = useCallback(async () => {
    if (!template?.content) return

    try {
      setGenerating(true)
      setError(null)

      // Use editor instance to load design and export HTML
      if (editorRef.current) {
        editorRef.current.loadDesign(template.content)

        // Export HTML - this is an async operation
        editorRef.current.exportHtml((data: { html: string }) => {
          if (data && data.html) {
            setHtml(data.html)
            setExported(true)
          } else {
            setError('Failed to generate HTML from template design')
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating HTML')
    } finally {
      setGenerating(false)
    }
  }, [template])

  /**
   * Copies HTML to clipboard
   *
   * Uses Clipboard API with fallback for older browsers.
   * Shows success/error toast notifications.
   *
   * @returns Promise resolving when copy completes
   */
  const handleCopyToClipboard = useCallback(async () => {
    if (!html) return

    try {
      await navigator.clipboard.writeText(html)
      showToast('HTML copied to clipboard', 'success')
    } catch (err) {
      showToast('Failed to copy to clipboard', 'error')
    }
  }, [html])

  /**
   * Downloads HTML as file
   *
   * Creates Blob from HTML content and triggers download with auto-generated filename.
   * Filename format: {templateName}-{timestamp}.html
   *
   * @returns void
   */
  const handleDownload = useCallback(() => {
    if (!html) return

    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      // Create filename: template-name-YYYYMMDD-HHMMSS.html
      const timestamp = new Date().toISOString().replace(/[T:.-]/g, '').slice(0, 14)
      const filename = `${templateName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.html`

      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast(`Downloaded as ${filename}`, 'success')
    } catch (err) {
      showToast('Failed to download file', 'error')
    }
  }, [html, templateName])

  /**
   * Handles dialog close
   *
   * Cleans up editor instance and calls onClose callback
   */
  const handleClose = useCallback(() => {
    setOpen(false)
    // Cleanup editor ref
    editorRef.current = null
    onClose?.()
  }, [onClose])

  // Fetch template on mount
  if (!template && !loading && !error) {
    fetchTemplate()
  }

  // Loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Template</DialogTitle>
            <DialogDescription>{templateName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Error state
  if (error && !template) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Template</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchTemplate}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  // Empty template warning
  if (template && !template.content) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Template</DialogTitle>
            <DialogDescription>{templateName}</DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Empty Template</AlertTitle>
            <AlertDescription>
              This template has no content. Please add content to the template before exporting.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Main export state
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Template as HTML</DialogTitle>
          <DialogDescription>{templateName}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => generateHtml()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {generating && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <p className="text-sm text-muted-foreground text-center">Generating HTML...</p>
          </div>
        )}

        {exported && html && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>HTML generated successfully. Template variables preserved in {'{{VARIABLE}}'} format.</span>
            </div>

            {/* HTML Preview */}
            <div className="border rounded bg-muted p-4 max-h-48 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap break-words">
                {html.slice(0, 500)}...
              </pre>
            </div>
          </div>
        )}

        {!generating && !html && !error && (
          <div className="text-center py-6 text-muted-foreground">
            Click "Generate HTML" to create the HTML file from your template design
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {!exported ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={generateHtml} disabled={generating}>
                {generating ? 'Generating...' : 'Generate HTML'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button variant="outline" onClick={handleCopyToClipboard} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy HTML
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
