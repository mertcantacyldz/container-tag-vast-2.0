/**
 * Input Component - Reusable Text Input
 *
 * Tailwind CSS ile styled, dark mode destekli input component
 */

import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;

  /** Error mesajı */
  error?: string;

  /** Full width input */
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  fullWidth = true,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <input
        {...props}
        className={`
          px-3 py-2 rounded-lg border
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${fullWidth ? 'w-full' : ''}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
