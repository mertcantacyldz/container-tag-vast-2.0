/**
 * Badge Component - Reusable Badge/Chip
 *
 * Tailwind CSS ile styled, dark mode destekli badge component
 */

import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge varyantı (renk) */
  variant?: 'success' | 'error' | 'warning' | 'info' | 'gray';

  /** Size */
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({
  variant = 'gray',
  size = 'md',
  children,
  className = '',
  ...props
}: BadgeProps) {
  // Variant styles
  const variantStyles = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      {...props}
      className={`
        inline-flex items-center gap-1
        font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
