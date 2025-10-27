import { describe, it, expect } from 'vitest';
import {
  isValidUnlayerDesign,
  validateFile,
  validateTextareaContent,
  parseAndValidateJSON,
  determineImportSource,
  MAX_JSON_SIZE,
  MAX_JSON_CHARS,
  VALIDATION_ERRORS,
  type UnlayerDesign,
} from '@/lib/utils/unlayer-validation';

describe('unlayer validation utilities', () => {
  describe('isValidUnlayerDesign()', () => {
    describe('valid designs', () => {
      it('should accept valid plain object', () => {
        const design = { body: { rows: [] } };
        expect(isValidUnlayerDesign(design)).toBe(true);
      });

      it('should accept object with all required Unlayer properties', () => {
        const design: UnlayerDesign = {
          body: {
            rows: [{ cells: [] }],
            values: { key: 'value' },
          },
          counters: {
            u_column: 1,
            u_row: 2,
            u_content: 3,
          },
          schemaVersion: 1,
        };
        expect(isValidUnlayerDesign(design)).toBe(true);
      });

      it('should accept object with extra properties', () => {
        const design = {
          body: { rows: [] },
          extra: 'property',
          another: 123,
        };
        expect(isValidUnlayerDesign(design)).toBe(true);
      });

      it('should accept empty object', () => {
        expect(isValidUnlayerDesign({})).toBe(true);
      });

      it('should accept nested objects', () => {
        const design = {
          body: {
            rows: [
              {
                cells: [
                  { values: { text: 'hello' } },
                ],
              },
            ],
            values: { key: { nested: { deep: true } } },
          },
        };
        expect(isValidUnlayerDesign(design)).toBe(true);
      });
    });

    describe('invalid designs', () => {
      it('should reject null', () => {
        expect(isValidUnlayerDesign(null)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(isValidUnlayerDesign(undefined)).toBe(false);
      });

      it('should reject primitives', () => {
        expect(isValidUnlayerDesign('string')).toBe(false);
        expect(isValidUnlayerDesign(123)).toBe(false);
        expect(isValidUnlayerDesign(true)).toBe(false);
      });

      it('should reject arrays', () => {
        expect(isValidUnlayerDesign([])).toBe(false);
        expect(isValidUnlayerDesign([{ body: [] }])).toBe(false);
      });
    });
  });

  describe('validateFile()', () => {
    describe('valid files', () => {
      it('should accept .json file within size limit', () => {
        const file = new File(['{}'], 'template.json', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should accept .json file with different casing', () => {
        const file = new File(['{}'], 'template.JSON', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should accept .json file with path', () => {
        const file = new File(['{}'], 'path/to/template.json', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should accept file at exactly 5 MB', () => {
        // Create a file exactly at the limit
        const largeContent = new ArrayBuffer(MAX_JSON_SIZE);
        const file = new File([largeContent], 'large.json', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    describe('invalid file extensions', () => {
      it('should reject .txt file', () => {
        const file = new File(['{}'], 'template.txt', { type: 'text/plain' });
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_FILE_TYPE);
      });

      it('should reject .js file', () => {
        const file = new File(['{}'], 'template.js', { type: 'text/javascript' });
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_FILE_TYPE);
      });

      it('should reject file without extension', () => {
        const file = new File(['{}'], 'template', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_FILE_TYPE);
      });

      it('should reject file with .json as part of name but wrong extension', () => {
        const file = new File(['{}'], 'my.json.backup', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_FILE_TYPE);
      });
    });

    describe('file size validation', () => {
      it('should reject file exceeding 5 MB', () => {
        const oversizeContent = new ArrayBuffer(MAX_JSON_SIZE + 1);
        const file = new File([oversizeContent], 'too-large.json', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.FILE_TOO_LARGE);
      });

      it('should reject significantly oversized file', () => {
        const content = new ArrayBuffer(MAX_JSON_SIZE * 2);
        const file = new File([content], 'huge.json', { type: 'application/json' });
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.FILE_TOO_LARGE);
      });
    });
  });

  describe('validateTextareaContent()', () => {
    describe('valid content', () => {
      it('should accept small JSON content', () => {
        const content = '{"body": {}}';
        const result = validateTextareaContent(content);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should accept content at exactly max size', () => {
        const content = 'a'.repeat(MAX_JSON_CHARS);
        const result = validateTextareaContent(content);
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should accept empty string', () => {
        const result = validateTextareaContent('');
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should accept large JSON content within limits', () => {
        const obj = {
          body: {
            rows: Array(100).fill({ cells: Array(5).fill({}) }),
            values: Object.fromEntries(Array(1000).fill(null).map((_, i) => [`key_${i}`, `value_${i}`])),
          },
        };
        const content = JSON.stringify(obj);
        if (content.length <= MAX_JSON_CHARS) {
          const result = validateTextareaContent(content);
          expect(result.valid).toBe(true);
          expect(result.error).toBeNull();
        }
      });
    });

    describe('oversized content', () => {
      it('should reject content exceeding max size', () => {
        const content = 'a'.repeat(MAX_JSON_CHARS + 1);
        const result = validateTextareaContent(content);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.PASTED_CONTENT_TOO_LARGE);
      });

      it('should reject significantly oversized content', () => {
        const content = 'x'.repeat(MAX_JSON_CHARS * 2);
        const result = validateTextareaContent(content);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.PASTED_CONTENT_TOO_LARGE);
      });
    });
  });

  describe('parseAndValidateJSON()', () => {
    describe('valid JSON', () => {
      it('should parse and return valid JSON object', () => {
        const json = '{"body": {"rows": []}}';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(true);
        expect(result.design).toEqual({ body: { rows: [] } });
        expect(result.error).toBeNull();
      });

      it('should parse complex Unlayer design', () => {
        const design: UnlayerDesign = {
          body: {
            rows: [{ cells: [] }],
            values: { key: 'value' },
          },
          counters: {
            u_column: 1,
            u_row: 2,
            u_content: 3,
          },
          schemaVersion: 1,
        };
        const json = JSON.stringify(design);
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(true);
        expect(result.design).toEqual(design);
        expect(result.error).toBeNull();
      });

      it('should handle JSON with extra properties', () => {
        const json = '{"body": {}, "extra": "data", "number": 123}';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(true);
        expect(result.design).toEqual({ body: {}, extra: 'data', number: 123 });
        expect(result.error).toBeNull();
      });

      it('should handle empty object JSON', () => {
        const json = '{}';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(true);
        expect(result.design).toEqual({});
        expect(result.error).toBeNull();
      });
    });

    describe('invalid JSON', () => {
      it('should reject malformed JSON', () => {
        const json = '{invalid json}';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(false);
        expect(result.design).toBeNull();
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_JSON);
      });

      it('should reject JSON with trailing comma', () => {
        const json = '{"body": {},}';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_JSON);
      });

      it('should reject incomplete JSON', () => {
        const json = '{"body": ';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_JSON);
      });

      it('should reject JSON array (non-object)', () => {
        const json = '[{"body": {}}]';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_UNLAYER_STRUCTURE);
      });

      it('should reject JSON primitive', () => {
        const json = '"just a string"';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_UNLAYER_STRUCTURE);
      });

      it('should reject JSON null', () => {
        const json = 'null';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_UNLAYER_STRUCTURE);
      });

      it('should reject empty string', () => {
        const result = parseAndValidateJSON('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(VALIDATION_ERRORS.INVALID_JSON);
      });
    });

    describe('edge cases', () => {
      it('should handle JSON with unicode characters', () => {
        const json = '{"name": "José", "city": "São Paulo"}';
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(true);
        expect((result.design as any)?.name).toBe('José');
      });

      it('should handle JSON with newlines and indentation', () => {
        const json = `
          {
            "body": {
              "rows": []
            }
          }
        `;
        const result = parseAndValidateJSON(json);
        expect(result.valid).toBe(true);
        expect(result.design?.body).toEqual({ rows: [] });
      });
    });
  });

  describe('determineImportSource()', () => {
    describe('file priority', () => {
      it('should prioritize file over textarea when both provided', () => {
        const file = new File(['{}'], 'template.json');
        const textContent = '{"body": {}}';
        const result = determineImportSource(file, textContent);
        expect(result.source).toBe('file');
        expect(result.content).toBe(file);
      });

      it('should use file when textarea is empty', () => {
        const file = new File(['{}'], 'template.json');
        const result = determineImportSource(file, '');
        expect(result.source).toBe('file');
        expect(result.content).toBe(file);
      });

      it('should use file when textarea is whitespace only', () => {
        const file = new File(['{}'], 'template.json');
        const result = determineImportSource(file, '   \n  \t  ');
        expect(result.source).toBe('file');
        expect(result.content).toBe(file);
      });
    });

    describe('textarea fallback', () => {
      it('should use textarea when file is null', () => {
        const textContent = '{"body": {}}';
        const result = determineImportSource(null, textContent);
        expect(result.source).toBe('textarea');
        expect(result.content).toBe(textContent);
      });

      it('should use textarea when file is null and content has whitespace', () => {
        const textContent = '  {"body": {}}  ';
        const result = determineImportSource(null, textContent);
        expect(result.source).toBe('textarea');
        expect(result.content).toBe(textContent);
      });
    });

    describe('no source', () => {
      it('should return null source when both are empty', () => {
        const result = determineImportSource(null, '');
        expect(result.source).toBeNull();
        expect(result.content).toBeNull();
      });

      it('should return null source when file is null and textarea is whitespace', () => {
        const result = determineImportSource(null, '   ');
        expect(result.source).toBeNull();
        expect(result.content).toBeNull();
      });

      it('should return null source when both are empty/null', () => {
        const result = determineImportSource(null, '');
        expect(result.source).toBeNull();
        expect(result.content).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle empty file with non-empty textarea', () => {
        const file = new File([], 'empty.json');
        const textContent = '{"body": {}}';
        const result = determineImportSource(file, textContent);
        expect(result.source).toBe('file');
        expect(result.content).toBe(file);
      });

      it('should trim whitespace from textarea check', () => {
        const result = determineImportSource(null, '\n\t  \n');
        expect(result.source).toBeNull();
        expect(result.content).toBeNull();
      });
    });
  });

  describe('VALIDATION_ERRORS constants', () => {
    it('should have all required error messages', () => {
      expect(VALIDATION_ERRORS).toHaveProperty('EMPTY_INPUT');
      expect(VALIDATION_ERRORS).toHaveProperty('INVALID_FILE_TYPE');
      expect(VALIDATION_ERRORS).toHaveProperty('FILE_TOO_LARGE');
      expect(VALIDATION_ERRORS).toHaveProperty('PASTED_CONTENT_TOO_LARGE');
      expect(VALIDATION_ERRORS).toHaveProperty('INVALID_JSON');
      expect(VALIDATION_ERRORS).toHaveProperty('INVALID_UNLAYER_STRUCTURE');
    });

    it('should have non-empty error messages', () => {
      Object.values(VALIDATION_ERRORS).forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('size constants', () => {
    it('should have MAX_JSON_SIZE set to 5 MB', () => {
      expect(MAX_JSON_SIZE).toBe(5 * 1024 * 1024);
    });

    it('should have MAX_JSON_CHARS set appropriately', () => {
      expect(MAX_JSON_CHARS).toBe(5_000_000);
    });
  });
});
