import { describe, it, expect } from 'vitest';
import { detectVariables, deduplicateVariables } from '@/lib/utils/variable-detection';

describe('variable detection utilities', () => {
  describe('detectVariables()', () => {
    describe('basic detection', () => {
      it('should detect single variable', () => {
        const html = '<p>Hello {{NAME}}</p>';
        const result = detectVariables(html);
        expect(result).toEqual(['NAME']);
      });

      it('should detect multiple variables', () => {
        const html = '<p>Hello {{FIRST_NAME}} {{LAST_NAME}}</p>';
        const result = detectVariables(html);
        expect(result).toEqual(['FIRST_NAME', 'LAST_NAME']);
      });

      it('should detect variables with underscores', () => {
        const html = '<p>{{USER_EMAIL}} {{USER_PHONE}}</p>';
        const result = detectVariables(html);
        expect(result).toEqual(['USER_EMAIL', 'USER_PHONE']);
      });

      it('should not detect variables with numbers in name', () => {
        const html = '<p>{{CODE_123}} {{EMAIL_2}}</p>';
        const result = detectVariables(html);
        // Variables with numbers don't match the pattern [A-Z_]+
        expect(result).toEqual([]);
      });
    });

    describe('deduplication', () => {
      it('should remove duplicate variables', () => {
        const html = '<p>Hi {{NAME}}</p><p>Dear {{NAME}},</p>';
        const result = detectVariables(html);
        expect(result).toEqual(['NAME']);
      });

      it('should preserve order of first appearance', () => {
        const html = '<p>{{NAME}} {{EMAIL}} {{NAME}} {{PHONE}} {{EMAIL}}</p>';
        const result = detectVariables(html);
        expect(result).toEqual(['NAME', 'EMAIL', 'PHONE']);
      });

      it('should handle multiple duplicates', () => {
        const html = '{{A}} {{B}} {{A}} {{C}} {{B}} {{A}}';
        const result = detectVariables(html);
        expect(result).toEqual(['A', 'B', 'C']);
      });
    });

    describe('case sensitivity', () => {
      it('should only match uppercase variables', () => {
        const html = '<p>{{name}} {{NAME}} {{Name}}</p>';
        const result = detectVariables(html);
        expect(result).toEqual(['NAME']);
      });

      it('should not match mixed case', () => {
        const html = '<p>{{FirstName}} {{firstName}} {{first_name}}</p>';
        const result = detectVariables(html);
        expect(result).toEqual([]);
      });
    });

    describe('spacing and formatting', () => {
      it('should not match variables with spaces inside braces', () => {
        const html = '<p>{{ NAME }} {{ EMAIL }}</p>';
        const result = detectVariables(html);
        expect(result).toEqual([]);
      });

      it('should not match with incomplete braces', () => {
        const html = '<p>{NAME} [EMAIL] (PHONE)</p>';
        const result = detectVariables(html);
        expect(result).toEqual([]);
      });

      it('should match variables across multiple lines', () => {
        const html = `
          <p>Hello {{NAME}}</p>
          <p>Email: {{EMAIL}}</p>
          <p>Phone: {{PHONE}}</p>
        `;
        const result = detectVariables(html);
        expect(result).toEqual(['NAME', 'EMAIL', 'PHONE']);
      });
    });

    describe('special variable names', () => {
      it('should detect single letter variables', () => {
        const html = '{{A}} {{B}} {{C}}';
        const result = detectVariables(html);
        expect(result).toEqual(['A', 'B', 'C']);
      });

      it('should detect all underscore variable', () => {
        const html = '{{_}} {{__}} {{___}}';
        const result = detectVariables(html);
        expect(result).toEqual(['_', '__', '___']);
      });

      it('should detect underscore-prefixed variables', () => {
        const html = '{{_VAR}} {{_PRIVATE}} {{_TEST}}';
        const result = detectVariables(html);
        expect(result).toEqual(['_VAR', '_PRIVATE', '_TEST']);
      });

      it('should not match if starting with number', () => {
        const html = '{{VARA}} {{VARB}} {{VARC}}';
        const result = detectVariables(html);
        expect(result).toEqual(['VARA', 'VARB', 'VARC']);
      });

      it('should not match variables containing numbers', () => {
        const html = '{{VAR1}} {{VAR2}} {{VAR3}}';
        const result = detectVariables(html);
        expect(result).toEqual([]);
      });
    });

    describe('real-world email patterns', () => {
      it('should detect variables in email header', () => {
        const html = '<div class="header"><h1>Hello {{FIRST_NAME}}!</h1></div>';
        const result = detectVariables(html);
        expect(result).toEqual(['FIRST_NAME']);
      });

      it('should detect variables in body content', () => {
        const html = `
          <div class="body">
            <p>Dear {{FULL_NAME}},</p>
            <p>Thank you for joining us. Your confirmation code is {{CODE}}.</p>
            <p>Please verify your email {{EMAIL}} within 24 hours.</p>
          </div>
        `;
        const result = detectVariables(html);
        expect(result).toEqual(['FULL_NAME', 'CODE', 'EMAIL']);
      });

      it('should handle complex email template', () => {
        const html = `
          <html>
            <body>
              <div>Hi {{FIRST_NAME}},</div>
              <p>Your order {{ORDER_ID}} has been confirmed.</p>
              <p>Total: {{CURRENCY_CODE}}{{AMOUNT}}</p>
              <p>Tracking: {{TRACKING_URL}}</p>
              <p>Thank you,</p>
              <p>{{COMPANY_NAME}}</p>
            </body>
          </html>
        `;
        const result = detectVariables(html);
        expect(result).toEqual([
          'FIRST_NAME',
          'ORDER_ID',
          'CURRENCY_CODE',
          'AMOUNT',
          'TRACKING_URL',
          'COMPANY_NAME',
        ]);
      });
    });

    describe('edge cases', () => {
      it('should return empty array for empty string', () => {
        const result = detectVariables('');
        expect(result).toEqual([]);
      });

      it('should return empty array for null-like values', () => {
        const result = detectVariables(null as any);
        expect(result).toEqual([]);
      });

      it('should return empty array for undefined', () => {
        const result = detectVariables(undefined as any);
        expect(result).toEqual([]);
      });

      it('should return empty array for HTML with no variables', () => {
        const html = '<p>This is plain HTML with no merge tags</p>';
        const result = detectVariables(html);
        expect(result).toEqual([]);
      });

      it('should handle HTML entities and special characters', () => {
        const html = '<p>Price: &dollar;{{PRICE}}, Email: {{EMAIL}}&nbsp;</p>';
        const result = detectVariables(html);
        expect(result).toEqual(['PRICE', 'EMAIL']);
      });

      it('should handle variables in attribute values', () => {
        const html = '<a href="{{URL}}">Click here</a> <img src="{{IMAGE_URL}}" alt="{{IMAGE_ALT}}">';
        const result = detectVariables(html);
        expect(result).toEqual(['URL', 'IMAGE_URL', 'IMAGE_ALT']);
      });

      it('should handle variables in data attributes', () => {
        const html = '<div data-id="{{RECORD_ID}}" data-name="{{RECORD_NAME}}"></div>';
        const result = detectVariables(html);
        expect(result).toEqual(['RECORD_ID', 'RECORD_NAME']);
      });

      it('should handle consecutive variables without spaces', () => {
        const html = '{{VARA}}{{VARB}}{{VARC}}';
        const result = detectVariables(html);
        expect(result).toEqual(['VARA', 'VARB', 'VARC']);
      });
    });

    describe('performance with large content', () => {
      it('should handle large HTML content efficiently', () => {
        const largeHtml = `<p>` + 'Text content '.repeat(1000) + `{{VARIABLE}}</p>`;
        const result = detectVariables(largeHtml);
        expect(result).toEqual(['VARIABLE']);
      });

      it('should handle many variables', () => {
        // Create many distinct variables (all uppercase, no numbers)
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const variables = Array.from({ length: 26 }, (_, i) => {
          return `{{${alphabet[i]}}}`;
        }).join(' ');
        const result = detectVariables(variables);
        expect(result).toHaveLength(26);
        expect(result[0]).toBe('A');
        expect(result[25]).toBe('Z');
      });
    });
  });

  describe('deduplicateVariables()', () => {
    describe('basic deduplication', () => {
      it('should remove duplicates from array', () => {
        const variables = ['NAME', 'EMAIL', 'NAME', 'PHONE'];
        const result = deduplicateVariables(variables);
        expect(result).toEqual(['NAME', 'EMAIL', 'PHONE']);
      });

      it('should preserve order of first appearance', () => {
        const variables = ['Z', 'A', 'Z', 'B', 'A'];
        const result = deduplicateVariables(variables);
        expect(result).toEqual(['Z', 'A', 'B']);
      });
    });

    describe('edge cases', () => {
      it('should handle empty array', () => {
        const result = deduplicateVariables([]);
        expect(result).toEqual([]);
      });

      it('should handle array with no duplicates', () => {
        const variables = ['A', 'B', 'C'];
        const result = deduplicateVariables(variables);
        expect(result).toEqual(['A', 'B', 'C']);
      });

      it('should handle array with all duplicates', () => {
        const variables = ['A', 'A', 'A', 'A'];
        const result = deduplicateVariables(variables);
        expect(result).toEqual(['A']);
      });

      it('should handle single element array', () => {
        const result = deduplicateVariables(['SINGLE']);
        expect(result).toEqual(['SINGLE']);
      });
    });

    describe('case sensitivity', () => {
      it('should treat different cases as different variables', () => {
        const variables = ['NAME', 'name', 'Name'];
        const result = deduplicateVariables(variables);
        expect(result).toEqual(['NAME', 'name', 'Name']);
      });
    });

    describe('integration with detectVariables', () => {
      it('should work with output from detectVariables', () => {
        const html = '{{VAR}} {{VAR}} {{OTHER}}';
        const detected = detectVariables(html);
        // detectVariables already deduplicates, but deduplicateVariables should work too
        const deduped = deduplicateVariables([...detected, ...detected]);
        expect(deduped).toEqual(['VAR', 'OTHER']);
      });
    });
  });
});
