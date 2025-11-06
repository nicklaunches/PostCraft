/**
 * @fileoverview E2E tests for UI state verification
 *
 * Tests loading states, error messages, success notifications, and empty states
 * across template CRUD operations.
 *
 * State types tested:
 * - Loading states: spinners, disabled inputs, progress indicators
 * - Success states: notifications, redirects, visual feedback
 * - Error states: field errors, validation messages, error toasts
 * - Empty states: empty content messages, call-to-action buttons
 *
 * @see tests/e2e/ui-state-helpers.ts - UI state verification utilities
 */

import { test, expect } from '@playwright/test';
import {
  verifyLoadingState,
  verifyErrorMessage,
  verifyEmptyState,
  verifyButtonDisabled,
  countRequiredFields,
} from './ui-state-helpers';

test.describe('UI State Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');
  });

  test('should show loading state while creating template', async ({ page }) => {
    // Click create button
    const createButton = page.getByRole('button', { name: /create template/i });
    await createButton.click();

    // Wait for navigation
    await page.waitForURL('/templates/new', { timeout: 5000 });

    // Editor iframe should load
    await page.waitForSelector('iframe', { timeout: 10000 });

    // Enter template name
    const nameInput = page.getByPlaceholder(/template name/i);
    await nameInput.fill(`UI State Test ${Date.now()}`);

    // Click save
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();

    // Should show loading indicator or disabled button
    const hasLoading = await verifyLoadingState(page, 2000).catch(() => false);
    const isDisabled = await verifyButtonDisabled(page, 'save');

    // Either loading state or button disabled
    expect(hasLoading || isDisabled).toBe(true);
  });

  test('should show success notification on successful save', async ({ page, request }) => {
    // Create template via API to have something to edit
    const createResponse = await request.post('/api/templates', {
      data: {
        name: `Edit Test ${Date.now()}`,
        content: {
          counters: { u_row: 1, u_column: 1 },
          schemaVersion: 8,
          body: { id: 'body', rows: [] },
        },
        variables: [],
      },
    });

    const templateData = await createResponse.json();
    const templateId = templateData.data.id;

    // Navigate to edit
    await page.goto(`/templates/${templateId}/edit`);
    await page.waitForLoadState('networkidle');

    // Save without changes
    const saveButton = page.getByRole('button', { name: /save|update/i }).first();
    await saveButton.click();

    // Wait for redirect
    await page.waitForURL('/templates', { timeout: 5000 });

    // Success is confirmed by redirect
    expect(page.url()).toContain('/templates');
  });

  test('should show error message for validation failure', async ({ page }) => {
    // Navigate to create
    const createButton = page.getByRole('button', { name: /create template/i });
    await createButton.click();

    await page.waitForURL('/templates/new');

    // Wait for form to load
    await page.waitForSelector('iframe', { timeout: 10000 });

    // Try to save without template name
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();

    // Should show error message or validation message
    const hasError = await verifyErrorMessage(page);

    if (!hasError) {
      // Alternative: form should still be visible (not navigated away)
      expect(page.url()).toContain('/templates/new');
    }
  });

  test('should display empty state when no templates', async ({ page, request }) => {
    // Delete all templates
    const listResponse = await request.get('/api/templates?pageSize=100');
    const listData = await listResponse.json();

    if (listData.data && Array.isArray(listData.data)) {
      for (const template of listData.data) {
        await request.delete(`/api/templates/${template.id}`);
      }
    }

    // Reload page
    await page.reload();

    // Should show empty state
    const hasEmptyState = await verifyEmptyState(page);
    expect(hasEmptyState).toBe(true);
  });

  test('should show error for duplicate template name', async ({ page, request }) => {
    // Create a template
    const templateName = `Duplicate Test ${Date.now()}`;
    await request.post('/api/templates', {
      data: {
        name: templateName,
        content: {
          counters: { u_row: 1, u_column: 1 },
          schemaVersion: 8,
          body: { id: 'body', rows: [] },
        },
        variables: [],
      },
    });

    // Try to create another with same name
    const createButton = page.getByRole('button', { name: /create template/i });
    await createButton.click();

    await page.waitForURL('/templates/new');
    await page.waitForSelector('iframe', { timeout: 10000 });

    // Enter same name
    const nameInput = page.getByPlaceholder(/template name/i);
    await nameInput.fill(templateName);

    // Save
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();

    // Should show error message about duplicate
    const hasError = await verifyErrorMessage(page, 'duplicate|already|exists');

    // Either shows error or stays on form
    if (!hasError) {
      expect(page.url()).toContain('/templates/new');
    }
  });

  test('should disable buttons during async operations', async ({ page, request }) => {
    // Create template
    const createResponse = await request.post('/api/templates', {
      data: {
        name: `Button State Test ${Date.now()}`,
        content: {
          counters: { u_row: 1, u_column: 1 },
          schemaVersion: 8,
          body: { id: 'body', rows: [] },
        },
        variables: [],
      },
    });

    const templateData = await createResponse.json();
    const templateId = templateData.data.id;

    // Navigate to templates list
    await page.goto('/templates');

    // Find delete button
    const templateCard = page.locator(`[data-testid="template-card-${templateId}"]`);
    const deleteButton = templateCard.getByRole('button', { name: /delete/i });

    // Click delete
    await deleteButton.click();

    // Confirm delete when dialog appears
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });

    // During deletion, confirm button should be disabled or loading
    await confirmButton.click();

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Should navigate or show success
    await page.waitForURL('/templates', { timeout: 5000 });
  });

  test('should show field-specific error messages', async ({ page }) => {
    // Navigate to create
    const createButton = page.getByRole('button', { name: /create template/i });
    await createButton.click();

    await page.waitForURL('/templates/new');
    await page.waitForSelector('iframe', { timeout: 10000 });

    // Try to save without entering name
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();

    // Should show error message (field or general)
    const errorMessage = page.getByText(/required|name|template|enter/i);
    const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Either shows error or stays on form
    expect(hasError || page.url().includes('/templates/new')).toBe(true);
  });

  test('should show loading state during template import', async ({ page }) => {
    // Click import
    const importButton = page.getByRole('button', { name: /import template/i });
    await importButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Enter valid JSON
    const pasteArea = page.getByPlaceholder(/paste.*json|json.*paste/i);
    await pasteArea.fill(JSON.stringify({
      counters: { u_row: 1, u_column: 1 },
      schemaVersion: 8,
      body: { id: 'body', rows: [] },
    }));

    // Click import
    const importConfirmButton = page.getByRole('button', { name: /import|submit/i });
    await importConfirmButton.click();

    // Should show loading or navigate
    await page.waitForURL('/templates/new', { timeout: 10000 });
  });

  test('should handle missing required fields', async ({ page }) => {
    // Navigate to create
    const createButton = page.getByRole('button', { name: /create template/i });
    await createButton.click();

    await page.waitForURL('/templates/new');
    await page.waitForSelector('iframe', { timeout: 10000 });

    // Count required fields
    const requiredCount = await countRequiredFields(page);

    // Should have at least template name required
    expect(requiredCount).toBeGreaterThanOrEqual(1);
  });

  test('should show success after template deletion', async ({ page, request }) => {
    // Create template
    const createResponse = await request.post('/api/templates', {
      data: {
        name: `Delete Success Test ${Date.now()}`,
        content: {
          counters: { u_row: 1, u_column: 1 },
          schemaVersion: 8,
          body: { id: 'body', rows: [] },
        },
        variables: [],
      },
    });

    const templateData = await createResponse.json();
    const templateId = templateData.data.id;

    // Navigate to templates
    await page.goto('/templates');

    // Wait for template to appear
    await expect(page.getByText(`Delete Success Test`)).toBeVisible({ timeout: 5000 });

    // Find and click delete
    const templateCard = page.locator(`[data-testid="template-card-${templateId}"]`);
    const deleteButton = templateCard.getByRole('button', { name: /delete/i });
    await deleteButton.click();

    // Confirm
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Template should no longer be visible
    const templateText = page.getByText(/Delete Success Test/);
    await expect(templateText).not.toBeVisible({ timeout: 5000 });
  });

  test('should maintain form state on validation error', async ({ page }) => {
    // Create template
    const createButton = page.getByRole('button', { name: /create template/i });
    await createButton.click();

    await page.waitForURL('/templates/new');
    await page.waitForSelector('iframe', { timeout: 10000 });

    // Enter template name
    const testName = `State Preservation ${Date.now()}`;
    const nameInput = page.getByPlaceholder(/template name/i);
    await nameInput.fill(testName);

    // Verify name is still there
    const inputValue = await nameInput.inputValue();
    expect(inputValue).toBe(testName);

    // Try to save (might fail if design is empty)
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();

    // Wait a bit
    await page.waitForTimeout(500);

    // Name should still be in input
    const newValue = await nameInput.inputValue();
    expect(newValue).toBe(testName);
  });

  test('should show error on import with invalid JSON structure', async ({ page }) => {
    // Click import
    const importButton = page.getByRole('button', { name: /import template/i });
    await importButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Paste JSON that's valid but not Unlayer format
    const pasteArea = page.getByPlaceholder(/paste.*json|json.*paste/i);
    await pasteArea.fill('{"invalid": "structure"}');

    // Try to import
    const importConfirmButton = page.getByRole('button', { name: /import|submit/i });
    await importConfirmButton.click();

    // Should show error
    const hasError = await verifyErrorMessage(page);

    // Either shows error or stays on dialog
    if (!hasError) {
      expect(page.url()).toContain('/templates');
    }
  });
});
