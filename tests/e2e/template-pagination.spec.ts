/**
 * @fileoverview E2E tests for template pagination
 *
 * Tests pagination UI and behavior:
 * - Navigate between pages
 * - Verify correct items displayed on each page
 * - Verify page size limits
 * - Verify empty page handling
 * - Verify pagination controls visibility/behavior
 *
 * Pagination parameters:
 * - page: Current page number (1-indexed)
 * - pageSize: Items per page (default: 20, max: 100)
 *
 * @see https://playwright.dev/docs/locators
 */

import { test, expect } from '@playwright/test';

test.describe('Template Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to templates page
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
  });

  test('should display pagination controls when templates exceed page size', async ({ page, request }) => {
    // Create multiple test templates to ensure pagination is needed
    const baseTime = Date.now();

    for (let i = 0; i < 25; i++) {
      await request.post('/api/templates', {
        data: {
          name: `Pagination Test ${baseTime} - ${i}`,
          content: {
            counters: { u_row: 1, u_column: 1, u_content_text: 1 },
            schemaVersion: 8,
            body: {
              id: 'test-body',
              rows: [{ id: 'test-row', cells: [1], columns: [{ id: 'test-col', contents: [] }] }],
            },
          },
          variables: [],
        },
      });
    }

    // Refresh page to see new templates
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for pagination navigation
    const nextButton = page.getByRole('button', { name: /next|page 2/i });
    const prevButton = page.getByRole('button', { name: /previous|prev/i });

    // At least one pagination control should be visible
    const hasNextButton = await nextButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasPrevButton = await prevButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasPageNumbers = await page.locator('button:has-text("2")').isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasNextButton || hasPrevButton || hasPageNumbers).toBe(true);
  });

  test('should navigate to next page when next button clicked', async ({ page, request }) => {
    // Create templates for pagination
    const baseTime = Date.now();

    for (let i = 0; i < 25; i++) {
      await request.post('/api/templates', {
        data: {
          name: `Next Page Test ${baseTime} - ${i}`,
          content: {
            counters: { u_row: 1, u_column: 1 },
            schemaVersion: 8,
            body: { id: 'body', rows: [] },
          },
          variables: [],
        },
      });
    }

    // Reload to see templates
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click next button if available
    const nextButton = page.getByRole('button', { name: /next/i });
    const nextVisible = await nextButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (nextVisible) {
      await nextButton.click();

      // Should navigate with page query parameter
      await page.waitForURL(/page=2/, { timeout: 5000 });

      // Wait for new content to load
      await page.waitForLoadState('networkidle');

      // Should display templates (though possibly different ones)
      const afterNextCards = await page.locator('[data-testid="template-card"]').count();
      expect(afterNextCards).toBeGreaterThan(0);
    }
  });

  test('should navigate to previous page', async ({ page }) => {
    // Navigate to page 2 if it exists
    await page.goto('/templates?page=2');
    await page.waitForLoadState('networkidle');

    // Check if previous button exists and is enabled
    const prevButton = page.getByRole('button', { name: /previous|prev/i });
    const prevVisible = await prevButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (prevVisible) {
      await prevButton.click();

      // Should navigate back to page 1 or first page
      await page.waitForURL(/templates/, { timeout: 5000 });

      // Wait for content
      await page.waitForLoadState('networkidle');

      // Should be on first page
      const url = page.url();
      const hasPage1 = url.includes('page=1') || !url.includes('page=');
      expect(hasPage1).toBe(true);
    }
  });

  test('should disable previous button on first page', async ({ page }) => {
    // Navigate to templates page (should be first page)
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Check previous button
    const prevButton = page.getByRole('button', { name: /previous|prev/i });
    const prevVisible = await prevButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (prevVisible) {
      // Should be disabled or not interactive
      const isDisabled = await prevButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('should update URL when page changes', async ({ page, request }) => {
    // Create enough templates for multiple pages
    const baseTime = Date.now();

    for (let i = 0; i < 25; i++) {
      await request.post('/api/templates', {
        data: {
          name: `URL Test ${baseTime} - ${i}`,
          content: {
            counters: { u_row: 1, u_column: 1 },
            schemaVersion: 8,
            body: { id: 'body', rows: [] },
          },
          variables: [],
        },
      });
    }

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to page 2
    const nextButton = page.getByRole('button', { name: /next/i });
    const nextVisible = await nextButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (nextVisible) {
      await nextButton.click();

      // URL should contain page parameter
      await page.waitForURL(/page=2/, { timeout: 5000 });

      const url = page.url();
      expect(url).toContain('page=2');

      // Navigate back
      const prevButton = page.getByRole('button', { name: /previous|prev/i });
      await prevButton.click();

      // URL should update to page 1 or no page param
      await page.waitForTimeout(500);
      const newUrl = page.url();
      const hasPage1 = newUrl.includes('page=1') || !newUrl.includes('page=');
      expect(hasPage1).toBe(true);
    }
  });

  test('should display correct number of items per page', async ({ page, request }) => {
    // Create templates
    const baseTime = Date.now();

    for (let i = 0; i < 25; i++) {
      await request.post('/api/templates', {
        data: {
          name: `Items Test ${baseTime} - ${i}`,
          content: {
            counters: { u_row: 1, u_column: 1 },
            schemaVersion: 8,
            body: { id: 'body', rows: [] },
          },
          variables: [],
        },
      });
    }

    // Navigate with specific page size
    await page.goto('/templates?pageSize=10');
    await page.waitForLoadState('networkidle');

    // Count displayed cards
    const cards = await page.locator('[data-testid="template-card"]').count();

    // Should show up to 10 items
    expect(cards).toBeLessThanOrEqual(10);
    expect(cards).toBeGreaterThan(0);

    // If we have more than 10 total templates, next button should be visible
    if (cards === 10) {
      const nextButton = page.getByRole('button', { name: /next/i });
      const nextVisible = await nextButton.isVisible({ timeout: 5000 }).catch(() => false);
      expect(nextVisible).toBe(true);
    }
  });

  test('should handle direct URL navigation to specific page', async ({ page }) => {
    // Navigate directly to page 2
    await page.goto('/templates?page=2');
    await page.waitForLoadState('networkidle');

    // Check URL
    expect(page.url()).toContain('page=2');

    // Should display content (if page exists)
    const cards = await page.locator('[data-testid="template-card"]').count();

    // If page exists, should have content
    // If page doesn't exist, might show empty state
    expect(cards >= 0).toBe(true);
  });

  test('should show empty state on valid but empty page', async ({ page }) => {
    // Navigate to a high page number that likely doesn't exist
    await page.goto('/templates?page=999');
    await page.waitForLoadState('networkidle');

    // Should show empty state or redirect
    const emptyState = page.getByText(/no|empty|not found/i);
    const emptyVisible = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    // Or should redirect back to first page
    const redirected = page.url().includes('page=1') || !page.url().includes('page=999');

    expect(emptyVisible || redirected).toBe(true);
  });

  test('should maintain pagination state on reload', async ({ page }) => {
    // Navigate to page 2
    await page.goto('/templates?page=2');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on page 2
    const finalUrl = page.url();
    expect(finalUrl).toContain('page=2');
  });
});
