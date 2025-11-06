import { describe, it, expect } from "vitest";
import { validateTemplateName, sanitizeTemplateName } from "@/lib/utils/validation";

describe("validation utilities", () => {
    describe("validateTemplateName()", () => {
        describe("valid cases", () => {
            it("should accept valid template names", () => {
                const testCases = [
                    "my-template",
                    "my_template",
                    "MyTemplate",
                    "template123",
                    "a",
                    "A",
                    "1",
                    "a-b-c",
                    "a_b_c",
                    "test-template-123",
                    "UPPERCASE_NAME",
                    "lowercase-name",
                    "MixedCase_Name-123",
                ];

                testCases.forEach((name) => {
                    const result = validateTemplateName(name);
                    expect(result.isValid).toBe(true);
                    expect(result.sanitized).toBe(name);
                    expect(result.error).toBeUndefined();
                });
            });

            it("should trim whitespace from valid names", () => {
                const result = validateTemplateName("  my-template  ");
                expect(result.isValid).toBe(true);
                expect(result.sanitized).toBe("my-template");
            });
        });

        describe("invalid cases - empty/whitespace", () => {
            it("should reject null", () => {
                const result = validateTemplateName(null as any);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe("Template name is required");
                expect(result.sanitized).toBe("");
            });

            it("should reject undefined", () => {
                const result = validateTemplateName(undefined as any);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe("Template name is required");
            });

      it('should reject empty string', () => {
        const result = validateTemplateName('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Template name is required');
      });            it("should reject whitespace-only string", () => {
                const result = validateTemplateName("   ");
                expect(result.isValid).toBe(false);
                expect(result.error).toBe("Template name cannot be empty");
            });
        });

        describe("invalid cases - length", () => {
            it("should reject names exceeding 100 characters", () => {
                const tooLong = "a".repeat(101);
                const result = validateTemplateName(tooLong);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe("Template name cannot exceed 100 characters");
            });

            it("should accept exactly 100 character names", () => {
                const exactly100 = "a".repeat(100);
                const result = validateTemplateName(exactly100);
                expect(result.isValid).toBe(true);
                expect(result.sanitized).toBe(exactly100);
            });
        });

        describe("invalid cases - special characters", () => {
            it("should reject names with spaces", () => {
                const result = validateTemplateName("my template");
                expect(result.isValid).toBe(false);
                expect(result.error).toBe(
                    "Template name can only contain alphanumeric characters, hyphens, and underscores",
                );
            });

            it("should reject names with special characters", () => {
                const specialChars = [
                    "!",
                    "@",
                    "#",
                    "$",
                    "%",
                    "^",
                    "&",
                    "*",
                    "(",
                    ")",
                    "=",
                    "+",
                    "[",
                    "]",
                    "{",
                    "}",
                    "|",
                    ";",
                    ":",
                    ",",
                    ".",
                    "<",
                    ">",
                    "?",
                    "/",
                ];

                specialChars.forEach((char) => {
                    const result = validateTemplateName(`my${char}template`);
                    expect(result.isValid).toBe(false);
                    expect(result.error).toBe(
                        "Template name can only contain alphanumeric characters, hyphens, and underscores",
                    );
                });
            });

            it("should reject names with international characters", () => {
                const result = validateTemplateName("café-template");
                expect(result.isValid).toBe(false);
                expect(result.error).toBe(
                    "Template name can only contain alphanumeric characters, hyphens, and underscores",
                );
            });
        });

        describe("edge cases", () => {
            it("should handle non-string types gracefully", () => {
                const testCases = [123 as any, true as any, {} as any, [] as any];

                testCases.forEach((value) => {
                    const result = validateTemplateName(value);
                    expect(result.isValid).toBe(false);
                    expect(result.error).toBe("Template name is required");
                });
            });
        });
    });

    describe("sanitizeTemplateName()", () => {
        describe("converts to lowercase", () => {
            it("should convert uppercase to lowercase", () => {
                expect(sanitizeTemplateName("UPPERCASE")).toBe("uppercase");
                expect(sanitizeTemplateName("MixedCase")).toBe("mixedcase");
            });
        });

        describe("removes special characters", () => {
            it("should replace special characters with hyphens", () => {
                expect(sanitizeTemplateName("my email!")).toBe("my-email-");
                expect(sanitizeTemplateName("hello@world")).toBe("hello-world");
                expect(sanitizeTemplateName("test#template$")).toBe("test-template-");
            });

            it("should handle spaces", () => {
                expect(sanitizeTemplateName("my template")).toBe("my-template");
                expect(sanitizeTemplateName("hello world email")).toBe("hello-world-email");
            });

            it("should handle international characters", () => {
                expect(sanitizeTemplateName("café")).toBe("caf-");
                expect(sanitizeTemplateName("naïve")).toBe("na-ve");
            });
        });

        describe("normalizes multiple consecutive separators", () => {
            it("should replace multiple hyphens with single hyphen", () => {
                expect(sanitizeTemplateName("my---template")).toBe("my-template");
            });

            it("should replace multiple spaces with single hyphen", () => {
                expect(sanitizeTemplateName("my   template")).toBe("my-template");
            });

            it("should normalize mixed separators", () => {
                expect(sanitizeTemplateName("my- - -template")).toBe("my-template");
            });
        });

        describe("respects length limits", () => {
            it("should truncate to 100 characters", () => {
                const tooLong = "a".repeat(150);
                const result = sanitizeTemplateName(tooLong);
                expect(result.length).toBe(100);
                expect(result).toBe("a".repeat(100));
            });

            it("should preserve underscores and hyphens in truncation", () => {
                const input = "a_b-c_d-".repeat(20); // Will be longer than 100
                const result = sanitizeTemplateName(input);
                expect(result.length).toBeLessThanOrEqual(100);
            });
        });

        describe("handles edge cases", () => {
            it("should handle empty string", () => {
                expect(sanitizeTemplateName("")).toBe("");
            });

      it('should handle only special characters', () => {
        expect(sanitizeTemplateName('!!!###$$$')).toBe('-');
      });            it("should preserve valid characters", () => {
                expect(sanitizeTemplateName("valid-name_123")).toBe("valid-name_123");
            });

            it("should handle leading/trailing special characters", () => {
                expect(sanitizeTemplateName("!my-template!")).toBe("-my-template-");
            });
        });
    });
});
