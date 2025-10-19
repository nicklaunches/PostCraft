'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Pagination } from '@/components/ui/pagination'
import { AlertCircle, FileText, Plus, Edit, Trash2, Download } from 'lucide-react'
import type { ListTemplatesResponse } from '@/specs/001-local-studio-dashboard/contracts/api-templates'

interface TemplateListProps {
  page: string
  pageSize: string
}

export function TemplateList({ page, pageSize }: TemplateListProps) {
  const router = useRouter()
  const [data, setData] = useState<ListTemplatesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  // Delete functionality will be implemented in Phase 8
                  alert('Delete feature coming soon!')
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

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
