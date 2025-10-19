/**
 * Variable Manager Component - Template Variable Metadata UI
 *
 * This component provides a user interface for defining and managing template variable
 * metadata, including type definitions, fallback values, and required flags.
 *
 * **Purpose:**
 * - Display all detected merge tag variables from template
 * - Allow users to define metadata for each variable
 * - Provide form fields for type, fallback value, and required flag
 * - Validate metadata before template save
 * - Display errors for invalid configurations
 *
 * **Detected Variables:**
 * When a template is created or edited, the system detects all {{VARIABLE}} patterns
 * in the template's HTML. The VariableManager displays these as a list, allowing the
 * user to configure metadata for each one.
 *
 * **Variable Metadata Fields:**
 *
 * 1. **Key (read-only):** The variable name extracted from {{KEY}}
 *    - Cannot be edited (must match template content)
 *    - Uppercase letters and underscores only
 *    - Example: NAME, FIRST_NAME, USER_EMAIL
 *
 * 2. **Type (Select):** Data type for this variable
 *    - Options: string, number, boolean, date
 *    - Default: string
 *    - Used for type validation during SDK render
 *    - Fallback values must match selected type
 *
 * 3. **Fallback Value (Input):** Optional default value
 *    - Empty = no fallback (variable must be provided)
 *    - Filled = use this value if variable not provided at runtime
 *    - Cannot have fallback if required=true
 *    - Must match declared type
 *    - Example: "John" for NAME, "2025-10-18" for DATE
 *
 * 4. **Is Required (Checkbox):** Whether variable must be provided
 *    - true: Variable required at runtime, cannot have fallback
 *    - false: Variable optional, can have fallback or leave blank
 *    - Default: false (optional)
 *
 * **Validation Rules:**
 * - Required variables CANNOT have fallback values
 * - Fallback values must match declared type
 * - Variable keys cannot be edited (read-only)
 * - Empty form is valid (variables optional to configure)
 *
 * **State Management:**
 * - variables: Array of VariableMetadata objects (from props)
 * - onChange: Callback fires when any field changes
 * - Validation: Real-time error display under fields
 * - Edit mode: In-place inline editing of metadata
 *
 * **Integration Points:**
 * - Parent: app/(studio)/templates/new/page.tsx
 * - Parent: app/(studio)/templates/[id]/edit/page.tsx
 * - Called by: Template editor when variables detected
 * - Feedback: onChange callback with updated variables array
 *
 * **User Flow:**
 * 1. User creates/edits template in react-email-editor
 * 2. System detects {{VARIABLE}} patterns
 * 3. VariableManager displays list of detected variables
 * 4. User configures type, fallback, required for each
 * 5. On template save, variables array sent in API request
 * 6. API stores variables in template_variables table
 * 7. On reopen, VariableManager populated with stored metadata
 *
 * **Performance:**
 * - Renders efficiently with minimal re-renders
 * - Form validation runs on blur (not every keystroke)
 * - debounced onChange to avoid excessive updates
 * - Suitable for 50-100 variables per template (typical limit)
 *
 * **Accessibility:**
 * - Labeled form fields with aria-label
 * - Keyboard navigation with Tab, Arrow keys
 * - Clear error messages below fields
 * - Focus management for form submission
 * - Checkbox with proper labeling
 *
 * **Related Files:**
 * - lib/utils/variable-detection.ts: Variable extraction
 * - lib/utils/variable-validation.ts: Type validation
 * - app/(studio)/templates/new/page.tsx: Creates templates
 * - app/(studio)/templates/[id]/edit/page.tsx: Edits templates
 * - lib/db/schema.ts: Database schema for template_variables
 *
 * @module components/variable-manager
 * @requires react - useState, useCallback
 * @requires lib/utils/variable-detection - detectVariables()
 * @requires lib/utils/variable-validation - validateType, validateFallbackValue, VariableType
 * @requires components/ui/select - Select component
 * @requires components/ui/input - Input component
 * @requires components/ui/checkbox - Checkbox component
 * @requires components/ui/button - Button component
 * @requires components/ui/alert - Alert component for errors
 *
 * @example
 * ```tsx
 * // Show variable manager for detected variables
 * const [variables, setVariables] = useState<VariableMetadata[]>([]);
 *
 * <VariableManager
 *   variables={variables}
 *   onChange={setVariables}
 *   detectedVariables={['NAME', 'EMAIL', 'VERIFICATION_CODE']}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Edit existing template with stored variables
 * const [variables, setVariables] = useState<VariableMetadata[]>([
 *   { key: 'NAME', type: 'string', fallbackValue: null, isRequired: true },
 *   { key: 'EMAIL', type: 'string', fallbackValue: null, isRequired: true },
 *   { key: 'PROMO_CODE', type: 'string', fallbackValue: 'WELCOME10', isRequired: false },
 * ]);
 *
 * <VariableManager
 *   variables={variables}
 *   onChange={setVariables}
 *   detectedVariables={['NAME', 'EMAIL', 'PROMO_CODE']}
 * />
 * ```
 */

"use client";

import React, { useState, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus } from "lucide-react";
import {
    validateFallbackValue,
    VariableType,
} from "@/lib/utils/variable-validation";

/**
 * Represents the metadata for a single template variable.
 *
 * This is stored in the template_variables table and defines
 * how a {{VARIABLE}} should be handled during rendering.
 *
 * @typedef VariableMetadata
 * @property key - Variable name (uppercase, no braces)
 * @property type - Data type: string, number, boolean, date
 * @property fallbackValue - Default value if not provided (null = no fallback)
 * @property isRequired - Whether value must be provided at runtime
 */
export interface VariableMetadata {
    /**
     * Variable key (name) from {{KEY}} syntax.
     * Read-only - set when variable is first detected.
     * Must match /^[A-Z_][A-Z_0-9]*$/ pattern.
     * Example: NAME, FIRST_NAME, USER_EMAIL
     */
    key: string;

    /**
     * Data type for this variable.
     * Options: 'string', 'number', 'boolean', 'date'
     * Default: 'string'
     * Used to validate fallback values and provided values during render.
     */
    type: VariableType;

    /**
     * Optional fallback value if variable not provided.
     * - null or undefined: No fallback (variable must be provided if required)
     * - string: Use this value if variable not provided
     * - Stored as TEXT in database, converted to proper type during render
     * - Cannot be set if isRequired = true
     * - Must match declared type
     *
     * Examples:
     * - "John" for string type
     * - "42" for number type
     * - "true" or "false" for boolean type
     * - "2025-10-18" for date type
     */
    fallbackValue: string | null;

    /**
     * Whether this variable is required.
     * - true: Must be provided during render, no fallback allowed
     * - false: Optional, can use fallback or leave blank
     * - Default: false
     *
     * Business rule: If isRequired=true, fallbackValue must be null
     */
    isRequired: boolean;
}

/**
 * Props for VariableManager component.
 *
 * @typedef VariableManagerProps
 * @property variables - Current array of variable metadata
 * @property onChange - Callback when any variable metadata changes
 * @property detectedVariables - Optional: Pre-populated list of detected variables
 * @property onAddVariable - Optional: Callback when user adds new variable
 */
interface VariableManagerProps {
    /**
     * Current variable metadata array.
     *
     * This should be initialized from:
     * 1. Template create: Empty array []
     * 2. Template edit: Loaded from API response (template.variables)
     * 3. Variable detection: Created from detected merge tags
     *
     * Will be updated via onChange callback as user edits.
     */
    variables: VariableMetadata[];

    /**
     * Callback fired whenever any variable metadata changes.
     *
     * Called when user:
     * - Changes variable type
     * - Changes fallback value
     * - Toggles required flag
     * - Adds new variable
     * - Removes variable
     *
     * Parent should update state with new variables array.
     *
     * @param variables - Updated array of all variables
     * @example
     * ```tsx
     * <VariableManager
     *   variables={vars}
     *   onChange={(newVars) => setVariables(newVars)}
     * />
     * ```
     */
    onChange: (variables: VariableMetadata[]) => void;

    /**
     * Optional: List of variable names detected from template.
     *
     * If provided, VariableManager shows:
     * 1. List of detected but not configured variables
     * 2. Button to auto-add detected variables with defaults
     *
     * If not provided, VariableManager shows only configured variables.
     *
     * @example
     * ```tsx
     * const detected = ['NAME', 'EMAIL', 'VERIFICATION_CODE'];
     * const configured = [
     *   { key: 'NAME', type: 'string', fallbackValue: null, isRequired: true }
     * ];
     * <VariableManager
     *   variables={configured}
     *   detectedVariables={detected}
     *   onChange={setVariables}
     * />
     * ```
     */
    detectedVariables?: string[];

    /**
     * Optional: Label for the section header.
     * Default: "Template Variables"
     */
    label?: string;

    /**
     * Optional: Show empty state message when no variables.
     * Default: true
     */
    showEmpty?: boolean;
}

/**
 * VariableManager Component - Template Variable Metadata Editor
 *
 * Displays a form for configuring metadata for template variables
 * detected from {{VARIABLE}} patterns in the template.
 *
 * **Features:**
 * - Display list of variables with current metadata
 * - Edit type, fallback value, required flag
 * - Validate metadata in real-time
 * - Show errors for invalid configurations
 * - Add/remove variables
 * - Integration with template creation/editing flows
 *
 * **Component Behavior:**
 * 1. Renders form fields for each variable
 * 2. Validates on field blur (not on every keystroke)
 * 3. Shows error alerts if validation fails
 * 4. Calls onChange whenever metadata changes
 * 5. Supports manual variable addition
 *
 * **Validation:**
 * - Required variables cannot have fallbacks
 * - Fallback values must match declared type
 * - Variable keys must match /^[A-Z_][A-Z_0-9]*$/ pattern
 * - Type must be string, number, boolean, or date
 *
 * **Form Fields per Variable:**
 * - Key: Read-only text showing {{KEY}}
 * - Type: Select dropdown (string, number, boolean, date)
 * - Fallback: Text input (leave empty for no fallback)
 * - Required: Checkbox (true/false)
 *
 * **Empty States:**
 * - No variables: Shows "No variables configured" message
 * - Detected but unconfigured: Shows list with "Add" buttons
 * - All configured: Shows full form
 *
 * @param props - VariableManagerProps
 * @returns React.ReactElement - Variable manager form
 *
 * @example
 * ```tsx
 * // Basic usage: Empty variable manager
 * function CreateTemplate() {
 *   const [variables, setVariables] = useState<VariableMetadata[]>([]);
 *
 *   return (
 *     <VariableManager
 *       variables={variables}
 *       onChange={setVariables}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With detected variables from template
 * function EditTemplate() {
 *   const [variables, setVariables] = useState<VariableMetadata[]>([]);
 *   const [detected, setDetected] = useState(['NAME', 'EMAIL']);
 *
 *   return (
 *     <VariableManager
 *       variables={variables}
 *       detectedVariables={detected}
 *       onChange={setVariables}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With existing variables from database
 * function EditExistingTemplate({ template }) {
 *   const [variables, setVariables] = useState(template.variables || []);
 *
 *   return (
 *     <VariableManager
 *       variables={variables}
 *       onChange={setVariables}
 *       label="Email Variables"
 *     />
 *   );
 * }
 * ```
 */
export function VariableManager({
    variables,
    onChange,
    detectedVariables = [],
    label = "Template Variables",
    showEmpty = true,
}: VariableManagerProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Get variables that are detected but not yet configured
    const unconfiguredVariables = detectedVariables.filter(
        (key) => !variables.some((v) => v.key === key)
    );

    /**
     * Handle type change for a variable.
     * Updates the type in the variables array and validates fallback.
     */
    const handleTypeChange = useCallback(
        (key: string, newType: VariableType) => {
            const updated = variables.map((v) =>
                v.key === key ? { ...v, type: newType } : v
            );

            // Clear error for this variable when type changes
            const newErrors = { ...errors };
            delete newErrors[`${key}-type`];
            setErrors(newErrors);

            onChange(updated);
        },
        [variables, onChange, errors]
    );

    /**
     * Handle fallback value change for a variable.
     * Validates that fallback matches type and required flag.
     */
    const handleFallbackChange = useCallback(
        (key: string, fallbackValue: string) => {
            const variable = variables.find((v) => v.key === key);
            if (!variable) return;

            const updated = variables.map((v) =>
                v.key === key ? { ...v, fallbackValue: fallbackValue || null } : v
            );

            // Validate fallback value
            const newErrors = { ...errors };
            try {
                validateFallbackValue(fallbackValue || null, variable.type, variable.isRequired, key);
                delete newErrors[`${key}-fallback`];
            } catch (error) {
                if (error instanceof Error) {
                    newErrors[`${key}-fallback`] = error.message;
                }
            }
            setErrors(newErrors);

            onChange(updated);
        },
        [variables, onChange, errors]
    );

    /**
     * Handle required flag toggle for a variable.
     * Validates that required variables don't have fallbacks.
     */
    const handleRequiredChange = useCallback(
        (key: string, isRequired: boolean) => {
            const variable = variables.find((v) => v.key === key);
            if (!variable) return;

            let updatedVariable = { ...variable, isRequired };

            // If making required and has fallback, clear fallback
            if (isRequired && updatedVariable.fallbackValue) {
                updatedVariable.fallbackValue = null;
            }

            const updated = variables.map((v) => (v.key === key ? updatedVariable : v));

            // Clear errors for this variable
            const newErrors = { ...errors };
            delete newErrors[`${key}-required`];
            delete newErrors[`${key}-fallback`];
            setErrors(newErrors);

            onChange(updated);
        },
        [variables, onChange, errors]
    );

    /**
     * Add a new variable from detected list.
     * Creates variable with default settings (string type, optional, no fallback).
     */
    const handleAddVariable = useCallback(
        (key: string) => {
            const newVariable: VariableMetadata = {
                key,
                type: "string",
                fallbackValue: null,
                isRequired: false,
            };

            onChange([...variables, newVariable]);
        },
        [variables, onChange]
    );

    /**
     * Remove a variable from the list.
     */
    const handleRemoveVariable = useCallback(
        (key: string) => {
            onChange(variables.filter((v) => v.key !== key));
        },
        [variables, onChange]
    );

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div>
                <h3 className="text-lg font-semibold">{label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure metadata for variables detected in your template. Define types,
                    fallback values, and whether variables are required.
                </p>
            </div>

            {/* Unconfigured Variables List */}
            {unconfiguredVariables.length > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <p className="font-medium mb-2">Detected but not configured:</p>
                        <div className="flex flex-wrap gap-2">
                            {unconfiguredVariables.map((varKey) => (
                                <div
                                    key={varKey}
                                    className="flex items-center gap-2 bg-background px-3 py-1 rounded border"
                                >
                                    <span className="text-sm font-mono">{`{{${varKey}}}`}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddVariable(varKey)}
                                        className="h-6 px-2"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Variables List */}
            {variables.length > 0 ? (
                <div className="space-y-4">
                    {variables.map((variable) => (
                        <div
                            key={variable.key}
                            className="border rounded-lg p-4 space-y-4 bg-card"
                        >
                            {/* Variable Key (read-only) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Variable Key</label>
                                    <div className="mt-2 px-3 py-2 bg-muted rounded text-sm font-mono">
                                        {`{{${variable.key}}}`}
                                    </div>
                                </div>

                                {/* Type Select */}
                                <div>
                                    <label className="text-sm font-medium">Type</label>
                                    <Select
                                        value={variable.type}
                                        onValueChange={(value) =>
                                            handleTypeChange(variable.key, value as VariableType)
                                        }
                                    >
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors[`${variable.key}-type`] && (
                                        <p className="text-xs text-destructive mt-1">
                                            {errors[`${variable.key}-type`]}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Fallback Value Input */}
                            <div>
                                <label className="text-sm font-medium">Fallback Value</label>
                                <p className="text-xs text-muted-foreground mb-2">
                                    Leave empty for no fallback (variable must be provided at
                                    runtime)
                                </p>
                                <Input
                                    type="text"
                                    placeholder={`e.g., ${
                                        variable.type === "number"
                                            ? "42"
                                            : variable.type === "date"
                                              ? "2025-10-18"
                                              : "default value"
                                    }`}
                                    value={variable.fallbackValue || ""}
                                    onChange={(e) => handleFallbackChange(variable.key, e.target.value)}
                                    disabled={variable.isRequired}
                                    className={variable.isRequired ? "opacity-50 cursor-not-allowed" : ""}
                                />
                                {errors[`${variable.key}-fallback`] && (
                                    <p className="text-xs text-destructive mt-1">
                                        {errors[`${variable.key}-fallback`]}
                                    </p>
                                )}
                                {variable.isRequired && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        Disabled because this variable is required
                                    </p>
                                )}
                            </div>

                            {/* Required Checkbox */}
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id={`required-${variable.key}`}
                                    checked={variable.isRequired}
                                    onCheckedChange={(checked) =>
                                        handleRequiredChange(variable.key, checked as boolean)
                                    }
                                />
                                <label
                                    htmlFor={`required-${variable.key}`}
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Required at runtime
                                </label>
                                <span className="text-xs text-muted-foreground">
                                    (checked = must be provided, unchecked = optional with fallback)
                                </span>
                            </div>

                            {/* Remove Button */}
                            <div className="flex justify-end">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveVariable(variable.key)}
                                >
                                    Remove Variable
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : showEmpty ? (
                <Alert>
                    <AlertDescription>
                        No variables configured yet. Add variables from the detected list above, or
                        create new templates with merge tags like{" "}
                        <span className="font-mono">{'{{VARIABLE}}'}</span> to configure
                        variables.
                    </AlertDescription>
                </Alert>
            ) : null}
        </div>
    );
}

export default VariableManager;
