/**
 * Log Entry - Individual Tracking Log Entry
 *
 * Tek bir tracking log kaydını görüntüler
 */

import { Badge } from '../ui/Badge';
import type { TrackingLog } from '~/lib/vast';

interface LogEntryProps {
  log: TrackingLog;
}

export function LogEntry({ log }: LogEntryProps) {
  // Status badge variant
  const statusVariant =
    log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'gray';

  // Status icon
  const statusIcon =
    log.status === 'success' ? (
      <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ) : log.status === 'error' ? (
      <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        className="h-4 w-4 text-gray-400 animate-pulse"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
    );

  // Format timestamp
  const formattedTime = log.timestamp.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  // Truncate URL for display
  const truncatedUrl =
    log.trackerUrl.length > 60
      ? log.trackerUrl.substring(0, 60) + '...'
      : log.trackerUrl;

  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Header: Time + Event + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1">
          {statusIcon}
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {formattedTime}
          </span>
          <Badge variant="info" size="sm">
            {log.eventType}
          </Badge>
        </div>
        <Badge variant={statusVariant} size="sm">
          {log.status === 'success' && `✓ ${log.statusCode || 200}`}
          {log.status === 'error' && '✗ Error'}
          {log.status === 'pending' && '⏳ Pending'}
        </Badge>
      </div>

      {/* Tracker URL */}
      <div className="ml-6">
        <p className="text-xs text-gray-600 dark:text-gray-300 font-mono break-all">
          {truncatedUrl}
        </p>
        {log.errorMessage && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Error: {log.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
