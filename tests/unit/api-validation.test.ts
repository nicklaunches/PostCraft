import { describe, it, expect } from 'vitest';
import {
  validateCreateTemplateRequest,
  validateUpdateTemplateRequest,
  validatePaginationParams,
} from '@/lib/utils/api-validation';

describe('api validation utilities', () => {
  describe('validateCreateTemplateRequest()', () => {
    describe('valid requests', () => {
      it('should accept minimal valid request', () => {
        const body = {
          name: 'my-template',
          content: { body: { rows: [] } },
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.data?.name).toBe('my-template');
        expect(result.data?.content).toEqual(body.content);
      });

      it('should accept request with variables', () => {
        const body = {
          name: 'welcome-email',
          content: { body: { rows: [] } },
          variables: [
            {
              key: 'USER_NAME',
              type: 'string',
              fallbackValue: 'Guest',
              isRequired: false,
            },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(true);
        expect(result.data?.variables).toHaveLength(1);
      });

      it('should accept request with html property', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          html: '<p>Hello</p>',
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(true);
        expect(result.data?.html).toBe('<p>Hello</p>');
      });

      it('should accept request with multiple variables', () => {
        const body = {
          name: 'order-confirmation',
          content: { body: { rows: [] } },
          variables: [
            { key: 'ORDER_ID', type: 'string', fallbackValue: null, isRequired: true },
            { key: 'AMOUNT', type: 'number', fallbackValue: '0', isRequired: false },
            { key: 'IS_PAID', type: 'boolean', fallbackValue: null, isRequired: false },
            { key: 'ORDER_DATE', type: 'date', fallbackValue: null, isRequired: false },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(true);
        expect(result.data?.variables).toHaveLength(4);
      });

      it('should accept all valid type values', () => {
        const types = ['string', 'number', 'boolean', 'date'];
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: types.map((type, i) => ({
            key: `VAR_${i}`,
            type: type as any,
            fallbackValue: null,
            isRequired: false,
          })),
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(true);
      });
    });

    describe('missing required fields', () => {
      it('should reject missing name', () => {
        const body = {
          content: { body: { rows: [] } },
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Request body missing required field: name');
      });

      it('should reject missing content', () => {
        const body = {
          name: 'template',
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Request body missing required field: content');
      });

      it('should reject both name and content missing', () => {
        const body = {};
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });

    describe('name validation', () => {
      it('should reject null name', () => {
        const body = {
          name: null,
          content: { body: { rows: [] } },
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('name'))).toBe(true);
      });

      it('should reject non-string name', () => {
        const testCases = [123, true, {}, []];
        testCases.forEach(value => {
          const body = {
            name: value,
            content: { body: { rows: [] } },
          };
          const result = validateCreateTemplateRequest(body);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('name'))).toBe(true);
        });
      });

      it('should reject empty string name', () => {
        const body = {
          name: '',
          content: { body: { rows: [] } },
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('name'))).toBe(true);
      });

      it('should reject whitespace-only name', () => {
        const body = {
          name: '   ',
          content: { body: { rows: [] } },
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
      });

      it('should reject name exceeding 100 characters', () => {
        const body = {
          name: 'a'.repeat(101),
          content: { body: { rows: [] } },
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('100'))).toBe(true);
      });

      it('should reject name with invalid characters', () => {
        const invalidNames = ['my template', 'my-template!', 'my@template', 'my.template', 'my/template'];
        invalidNames.forEach(name => {
          const body = {
            name,
            content: { body: { rows: [] } },
          };
          const result = validateCreateTemplateRequest(body);
          expect(result.valid).toBe(false);
        });
      });

      it('should accept name with valid characters', () => {
        const validNames = ['my-template', 'my_template', 'my123template', 'a', 'TEST_TEMPLATE_123'];
        validNames.forEach(name => {
          const body = {
            name,
            content: { body: { rows: [] } },
          };
          const result = validateCreateTemplateRequest(body);
          expect(result.valid).toBe(true);
        });
      });
    });

    describe('content validation', () => {
      it('should reject null content', () => {
        const body = {
          name: 'template',
          content: null,
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        // null fails the !body.content check first
        expect(result.errors.some(e => e.includes('content') || e.includes('null'))).toBe(true);
      });

      it('should reject non-object content', () => {
        const testCases = ['string', 123, true];
        testCases.forEach(value => {
          const body = {
            name: 'template',
            content: value,
          };
          const result = validateCreateTemplateRequest(body);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('content'))).toBe(true);
        });
      });

      it('should accept arrays as content (arrays are objects)', () => {
        const body = {
          name: 'template',
          content: [],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(true);
      });

      it('should accept any object as content', () => {
        const validContents = [
          {},
          { body: { rows: [] } },
          { body: { rows: [], values: {} }, counters: { u_row: 0 } },
          { any: 'structure' },
        ];
        validContents.forEach(content => {
          const body = {
            name: 'template',
            content,
          };
          const result = validateCreateTemplateRequest(body);
          expect(result.valid).toBe(true);
        });
      });
    });

    describe('variables validation', () => {
      it('should accept empty variables array', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(true);
      });

      it('should reject non-array variables', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: { key: 'value' },
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('array'))).toBe(true);
      });

      it('should validate each variable in array', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [
            { key: 'VALID', type: 'string', fallbackValue: null, isRequired: false },
            { key: null, type: 'string', fallbackValue: null, isRequired: false }, // invalid
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should require variable key', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [
            { type: 'string', fallbackValue: null, isRequired: false },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('key'))).toBe(true);
      });

      it('should require variable type', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [
            { key: 'VAR', fallbackValue: null, isRequired: false },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('type'))).toBe(true);
      });

      it('should validate variable key format', () => {
        const invalidKeys = ['lowercase', 'kebab-case', '123START', 'key-name', 'key.name'];
        invalidKeys.forEach(key => {
          const body = {
            name: 'template',
            content: { body: { rows: [] } },
            variables: [
              { key, type: 'string', fallbackValue: null, isRequired: false },
            ],
          };
          const result = validateCreateTemplateRequest(body);
          expect(result.valid).toBe(false);
        });
      });

      it('should accept valid variable key formats', () => {
        const validKeys = ['UPPERCASE', 'WITH_UNDERSCORE', '_PRIVATE', 'VAR123', 'A', '_'];
        validKeys.forEach(key => {
          const body = {
            name: 'template',
            content: { body: { rows: [] } },
            variables: [
              { key, type: 'string', fallbackValue: null, isRequired: false },
            ],
          };
          const result = validateCreateTemplateRequest(body);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid variable type', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [
            { key: 'VAR', type: 'invalid_type', fallbackValue: null, isRequired: false },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('type'))).toBe(true);
      });

      it('should reject required variables with fallback values', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [
            {
              key: 'REQUIRED_VAR',
              type: 'string',
              fallbackValue: 'has-fallback',
              isRequired: true,
            },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('required'))).toBe(true);
      });

      it('should reject non-string fallback values', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [
            {
              key: 'VAR',
              type: 'string',
              fallbackValue: 123,
              isRequired: false,
            },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('fallbackValue'))).toBe(true);
      });

      it('should reject non-boolean isRequired', () => {
        const body = {
          name: 'template',
          content: { body: { rows: [] } },
          variables: [
            {
              key: 'VAR',
              type: 'string',
              fallbackValue: null,
              isRequired: 'yes',
            },
          ],
        };
        const result = validateCreateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('isRequired'))).toBe(true);
      });
    });

    describe('non-object body', () => {
      it('should reject null body', () => {
        const result = validateCreateTemplateRequest(null);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('JSON object'))).toBe(true);
      });

      it('should reject undefined body', () => {
        const result = validateCreateTemplateRequest(undefined);
        expect(result.valid).toBe(false);
      });

      it('should reject string body', () => {
        const result = validateCreateTemplateRequest('not an object');
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validateUpdateTemplateRequest()', () => {
    describe('valid requests', () => {
      it('should accept minimal valid request', () => {
        const body = {
          content: { body: { rows: [] } },
        };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(true);
        expect(result.data?.content).toEqual(body.content);
      });

      it('should accept request with variables', () => {
        const body = {
          content: { body: { rows: [] } },
          variables: [
            {
              key: 'USER_NAME',
              type: 'string',
              fallbackValue: null,
              isRequired: true,
            },
          ],
        };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(true);
      });

      it('should accept request with html', () => {
        const body = {
          content: { body: { rows: [] } },
          html: '<p>Updated content</p>',
        };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(true);
      });
    });

    describe('content validation', () => {
      it('should reject missing content', () => {
        const body = { variables: [] };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('content'))).toBe(true);
      });

      it('should reject null content', () => {
        const body = { content: null };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(false);
      });

      it('should reject non-object content', () => {
        const body = { content: 'not an object' };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(false);
      });
    });

    describe('variables validation in updates', () => {
      it('should validate variables array', () => {
        const body = {
          content: { body: { rows: [] } },
          variables: 'not an array',
        };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('array'))).toBe(true);
      });

      it('should validate each variable in update', () => {
        const body = {
          content: { body: { rows: [] } },
          variables: [
            { key: 'VALID', type: 'string', fallbackValue: null, isRequired: false },
            { key: 'INVALID', type: 'wrong_type', fallbackValue: null, isRequired: false },
          ],
        };
        const result = validateUpdateTemplateRequest(body);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validatePaginationParams()', () => {
    describe('valid pagination', () => {
      it('should accept valid page and pageSize', () => {
        const result = validatePaginationParams('2', '20');
        expect(result.valid).toBe(true);
        expect(result.data?.page).toBe(2);
        expect(result.data?.pageSize).toBe(20);
      });

      it('should use defaults when parameters omitted', () => {
        const result = validatePaginationParams(undefined, undefined);
        expect(result.valid).toBe(true);
        expect(result.data?.page).toBe(1);
        expect(result.data?.pageSize).toBe(20);
      });

      it('should use page default when omitted', () => {
        const result = validatePaginationParams(undefined, '10');
        expect(result.valid).toBe(true);
        expect(result.data?.page).toBe(1);
        expect(result.data?.pageSize).toBe(10);
      });

      it('should use pageSize default when omitted', () => {
        const result = validatePaginationParams('5', undefined);
        expect(result.valid).toBe(true);
        expect(result.data?.page).toBe(5);
        expect(result.data?.pageSize).toBe(20);
      });

      it('should accept but clamp pageSize to 100 maximum', () => {
        const result = validatePaginationParams('1', '200');
        expect(result.valid).toBe(false); // Fails validation because 200 > 100
        expect(result.errors.some(e => e.includes('100'))).toBe(true);
      });

      it('should accept page 1', () => {
        const result = validatePaginationParams('1', '20');
        expect(result.valid).toBe(true);
        expect(result.data?.page).toBe(1);
      });

      it('should accept pageSize 1', () => {
        const result = validatePaginationParams('1', '1');
        expect(result.valid).toBe(true);
        expect(result.data?.pageSize).toBe(1);
      });

      it('should accept pageSize 100', () => {
        const result = validatePaginationParams('1', '100');
        expect(result.valid).toBe(true);
        expect(result.data?.pageSize).toBe(100);
      });
    });

    describe('invalid page parameter', () => {
      it('should reject non-numeric page', () => {
        const result = validatePaginationParams('abc', '20');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('page'))).toBe(true);
      });

      it('should reject negative page', () => {
        const result = validatePaginationParams('-1', '20');
        expect(result.valid).toBe(false);
      });

      it('should reject zero page', () => {
        const result = validatePaginationParams('0', '20');
        expect(result.valid).toBe(false);
      });

      it('should accept decimal page (parseInt truncates to integer)', () => {
        const result = validatePaginationParams('1.5', '20');
        expect(result.valid).toBe(true);
        expect(result.data?.page).toBe(1); // parseInt('1.5') = 1
      });
    });

    describe('invalid pageSize parameter', () => {
      it('should reject non-numeric pageSize', () => {
        const result = validatePaginationParams('1', 'xyz');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('pageSize'))).toBe(true);
      });

      it('should reject negative pageSize', () => {
        const result = validatePaginationParams('1', '-10');
        expect(result.valid).toBe(false);
      });

      it('should reject zero pageSize', () => {
        const result = validatePaginationParams('1', '0');
        expect(result.valid).toBe(false);
      });

      it('should reject pageSize exceeding 100', () => {
        const result = validatePaginationParams('1', '101');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('100'))).toBe(true);
      });

      it('should reject pageSize > 100', () => {
        const result = validatePaginationParams('1', '1000');
        expect(result.valid).toBe(false);
      });

      it('should accept decimal pageSize (parseInt truncates to integer)', () => {
        const result = validatePaginationParams('1', '20.5');
        expect(result.valid).toBe(true);
        expect(result.data?.pageSize).toBe(20); // parseInt('20.5') = 20
      });
    });
  });

  describe('ValidationResult type', () => {
    it('should have valid and errors properties', () => {
      const result = validateCreateTemplateRequest(null);
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should have data property on valid request', () => {
      const body = {
        name: 'template',
        content: { body: { rows: [] } },
      };
      const result = validateCreateTemplateRequest(body);
      expect(result).toHaveProperty('data');
    });
  });
});
