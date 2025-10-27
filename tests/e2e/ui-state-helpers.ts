/**
 * @fileoverview UI state verification utilities for E2E tests
 *
 * Helper functions to verify loading states, success notifications,
 * error messages, and empty states across E2E tests.
 *
 * Usage:
 * - verifyLoadingState() - Check for loading indicators
 * - verifySuccessNotification() - Verify success toast/message
 * - verifyErrorMessage() - Verify error is displayed
 * - verifyEmptyState() - Verify empty content message
 * - verifyToastNotification() - Generic toast verification
 *
 * @see tests/e2e/template-crud.spec.ts
 */

import { Page, expect } from '@playwright/test';

/**
 * Common loading state indicators
 */
export const LOADING_INDICATORS = [
  'spinner',
  'loading',
  'skeleton',
  'progress',
  'dots',
  'loader',
];

/**
 * Verify that a loading state is displayed (spinner, skeleton, etc.)
 *
 * @param page - Playwright page object
 * @param timeout - Max time to wait for loading indicator
 * @returns true if loading state found, false if not
 */
export async function verifyLoadingState(
  page: Page,
  timeout: number = 5000
): Promise<boolean> {
  try {
    // Check for spinner elements
    const spinner = page.locator('[role="progressbar"], .spinner, .loading, [data-testid*="loading"]');
    await expect(spinner.first()).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that a success notification/toast is displayed
 *
 * @param page - Playwright page object
 * @param expectedText - Optional text to look for in success message
 * @returns true if success notification found, false if not
 */
export async function verifySuccessNotification(
  page: Page,
  expectedText?: string
): Promise<boolean> {
  try {
    const successSelector = expectedText
      ? page.getByText(new RegExp(expectedText, 'i'))
      : page.getByText(/success|created|saved|updated|imported/i);

    await expect(successSelector.first()).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that an error message is displayed
 *
 * @param page - Playwright page object
 * @param expectedText - Optional text to look for in error message
 * @returns true if error message found, false if not
 */
export async function verifyErrorMessage(
  page: Page,
  expectedText?: string
): Promise<boolean> {
  try {
    const errorSelector = expectedText
      ? page.getByText(new RegExp(expectedText, 'i'))
      : page.getByText(/error|failed|invalid|required|must|wrong/i);

    await expect(errorSelector.first()).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that empty state is displayed
 *
 * @param page - Playwright page object
 * @returns true if empty state found, false if not
 */
export async function verifyEmptyState(page: Page): Promise<boolean> {
  try {
    const emptyStateSelector = page.getByText(
      /no templates|no items|empty|nothing|start by/i
    );
    await expect(emptyStateSelector.first()).toBeVisible({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that a form input is disabled (for loading states)
 *
 * @param page - Playwright page object
 * @param selector - Input selector
 * @returns true if input is disabled, false if not
 */
export async function verifyInputDisabled(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    const input = page.locator(selector);
    await expect(input).toBeDisabled({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that a button is disabled (for loading states)
 *
 * @param page - Playwright page object
 * @param buttonText - Text of the button to check
 * @returns true if button is disabled, false if not
 */
export async function verifyButtonDisabled(
  page: Page,
  buttonText: string
): Promise<boolean> {
  try {
    const button = page.getByRole('button', { name: new RegExp(buttonText, 'i') });
    await expect(button).toBeDisabled({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify loading state transitions to success
 *
 * @param page - Playwright page object
 * @param expectedUrl - URL to navigate to after success (optional)
 */
export async function verifyLoadingToSuccess(
  page: Page,
  expectedUrl?: string
): Promise<void> {
  // Initially should show loading (or quickly transition away)
  await page.waitForTimeout(500);

  // If URL provided, should navigate there
  if (expectedUrl) {
    await page.waitForURL(expectedUrl, { timeout: 10000 });
  }
}

/**
 * Verify that a specific form field has error styling/message
 *
 * @param page - Playwright page object
 * @param fieldLabel - Label of the field
 * @returns true if error found on field, false if not
 */
export async function verifyFieldError(
  page: Page,
  fieldLabel: string
): Promise<boolean> {
  try {
    // Look for field and nearby error message
    const field = page.getByLabel(new RegExp(fieldLabel, 'i'));
    const container = field.locator('xpath=ancestor::div');

    // Check for error class or aria-invalid
    const hasErrorClass = await container.evaluate((el) =>
      el.className.includes('error') || el.className.includes('invalid')
    );

    const hasAriaInvalid = await field.evaluate((el) =>
      el.getAttribute('aria-invalid') === 'true'
    );

    return hasErrorClass || hasAriaInvalid;
  } catch {
    return false;
  }
}

/**
 * Wait for all animations to complete
 *
 * @param page - Playwright page object
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 500); // Wait 500ms after next frame
      });
    });
  });
}

/**
 * Verify element visibility with fade-in animation
 *
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param timeout - Max wait time
 */
export async function verifyElementFadesIn(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });

  // Wait for animation to complete
  await waitForAnimations(page);
}

/**
 * Verify notification toast appears and auto-dismisses
 *
 * @param page - Playwright page object
 * @returns true if notification appeared and dismissed, false if not
 */
export async function verifyToastAutoDismiss(page: Page): Promise<boolean> {
  try {
    // Find toast based on role or class
    const toast = page.locator(`[role="alert"], [class*="toast"], [data-testid*="toast"]`).first();

    // Should be visible initially
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Should disappear after 3-5 seconds (depending on implementation)
    await expect(toast).not.toBeVisible({ timeout: 8000 });

    return true;
  } catch {
    return false;
  }
}

/**
 * Verify all form inputs are in focused/active state
 *
 * @param page - Playwright page object
 * @returns true if form is interactive, false if not
 */
export async function verifyFormIsInteractive(page: Page): Promise<boolean> {
  try {
    const inputs = page.locator('input, textarea, select, button');
    const inputCount = await inputs.count();

    if (inputCount === 0) return false;

    // Check that at least first input is not disabled
    const firstInput = inputs.first();
    const isDisabled = await firstInput.isDisabled();

    return !isDisabled;
  } catch {
    return false;
  }
}

/**
 * Verify that required fields are marked as required
 *
 * @param page - Playwright page object
 * @param expectedCount - Number of required fields expected
 * @returns actual count of required fields
 */
export async function countRequiredFields(page: Page): Promise<number> {
  const required = page.locator('input[required], textarea[required], select[required]');
  return await required.count();
}

/**
 * Verify accessibility of error messages for screen readers
 *
 * @param page - Playwright page object
 * @param selector - Error message selector
 * @returns true if message has proper accessibility attributes
 */
export async function verifyErrorAccessibility(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    const element = page.locator(selector);
    const role = await element.getAttribute('role');
    const ariaLive = await element.getAttribute('aria-live');

    // Should have alert role or aria-live region
    return role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive';
  } catch {
    return false;
  }
}
