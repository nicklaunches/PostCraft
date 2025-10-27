/**
 * @fileoverview Unlayer API Mock Factory
 *
 * Provides mock implementations for Unlayer email editor API used during testing.
 * Mocks are isolated from real API, enabling fast, deterministic, offline tests.
 *
 * Exported Functions:
 * - createUnlayerMock() - Factory for creating mock editor instance
 *
 * Usage:
 * @example
 * // In tests
 * const mockEditor = createUnlayerMock();
 * await mockEditor.loadDesign(sampleDesign);
 * const html = await mockEditor.exportHtml();
 *
 * @see tests/mocks/fixtures/sample-template.json for sample design
 */

/**
 * Mock Unlayer Design - simplified valid structure for testing
 */
export interface MockUnlayerDesign {
  body: {
    rows: Array<{
      cells: number[];
      columns: Array<{
        id: string;
        contents: unknown[];
        values: Record<string, unknown>;
      }>;
      values: Record<string, unknown>;
    }>;
  };
  counters: Record<string, number>;
  schemaVersion: number;
}

/**
 * Mock Unlayer Editor API
 */
export interface MockUnlayerEditor {
  loadDesign: (design: unknown) => Promise<void>;
  saveDesign: (callback: (design: unknown) => void) => Promise<void>;
  exportHtml: (callback: (html: unknown) => void) => Promise<void>;
}

/**
 * Create a mock Unlayer editor instance for testing
 *
 * Returns an object that mimics the react-email-editor API without
 * actually rendering or connecting to Unlayer servers.
 *
 * @returns {MockUnlayerEditor} Mock editor instance
 *
 * @example
 * const mockEditor = createUnlayerMock();
 * mockEditor.loadDesign({ body: { rows: [] }, counters: {}, schemaVersion: 12 });
 */
export function createUnlayerMock(): MockUnlayerEditor {
  let currentDesign: unknown = null;

  return {
    /**
     * Load a design into the mock editor
     */
    async loadDesign(design: unknown) {
      if (!design || typeof design !== 'object') {
        throw new Error('Invalid design provided to loadDesign');
      }
      currentDesign = design;
    },

    /**
     * Save the current design (calls callback synchronously)
     */
    async saveDesign(callback: (design: unknown) => void) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      callback(currentDesign);
    },

    /**
     * Export design as HTML string
     */
    async exportHtml(callback: (html: unknown) => void) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      // Generate minimal HTML from design
      const html =
        '<html><body>' +
        '<h1>Email Template</h1>' +
        '<p>This is a test email template.</p>' +
        '</body></html>';

      callback(html);
    },
  };
}
