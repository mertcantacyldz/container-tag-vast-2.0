/**
 * Card Component - Reusable Card Container
 *
 * Tailwind CSS ile styled, dark mode destekli card component
 */

import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card başlığı */
  title?: string | ReactNode;

  /** Card padding (default: true) */
  padding?: boolean;
}

export function Card({
  title,
  padding = true,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm
        ${className}
      `}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}

      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  );
}
