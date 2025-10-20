/**
 * @fileoverview Utility functions for class name merging
 *
 * Provides helper functions for combining Tailwind CSS class names while
 * preventing conflicting utility classes. Uses clsx for conditional class
 * handling and tailwind-merge to resolve conflicts.
 *
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names with Tailwind CSS conflict resolution
 *
 * Combines multiple class name values using clsx for conditional logic,
 * then applies tailwind-merge to remove conflicting Tailwind utilities.
 * This prevents issues like both "w-full" and "w-1/2" being applied.
 *
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns {string} Merged class string with Tailwind conflicts resolved
 *
 * @example
 * // Simple merge
 * cn('px-2', 'py-1') // => "px-2 py-1"
 *
 * @example
 * // Conditional classes
 * cn('px-2', isActive && 'bg-primary-500', !isActive && 'bg-gray-500')
 *
 * @example
 * // Tailwind conflict resolution
 * cn('w-full', 'w-1/2') // => "w-1/2" (conflict resolved)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
