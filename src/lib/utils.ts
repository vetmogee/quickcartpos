// Import utility functions for class name merging
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function to merge Tailwind CSS classes with conditional classes
// Uses clsx for conditional class merging and tailwind-merge to handle Tailwind class conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
