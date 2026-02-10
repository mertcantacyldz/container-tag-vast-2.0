/**
 * Select Component - Reusable Dropdown Select
 *
 * Tailwind CSS ile styled, dark mode destekli select component
 */

import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Select label */
  label?: string;

  /** Options array */
  options: SelectOption[];

  /** Error mesajı */
  error?: string;

  /** Full width select */
  fullWidth?: boolean;
}

export function Select({
  label,
  options,
  error,
  fullWidth = true,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <select
        {...props}
        className={`
          px-3 py-2 rounded-lg border
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${fullWidth ? 'w-full' : ''}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
