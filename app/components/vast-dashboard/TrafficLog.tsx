/**
 * Traffic Log - Canlı Tracking Log Paneli
 *
 * Tüm tracking log'larını listeler ve OTS badge'ini gösterir
 */

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LogEntry } from './LogEntry';
import { OTSBadge } from './OTSBadge';
import type { TrackingLog } from '~/lib/vast';

interface TrafficLogProps {
  /** Log'lar */
  logs: TrackingLog[];

  /** OTS başarıyla gerçekleşti mi? */
  otsAchieved: boolean;

  /** Log temizleme callback */
  onClear: () => void;
}

export function TrafficLog({ logs, otsAchieved, onClear }: TrafficLogProps) {
  // Log istatistikleri
  const successCount = logs.filter((l) => l.status === 'success').length;
  const errorCount = logs.filter((l) => l.status === 'error').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span>Traffic Log</span>
          {logs.length > 0 && (
            <Button variant="secondary" onClick={onClear} className="text-xs px-2 py-1">
              Temizle
            </Button>
          )}
        </div>
      }
      padding={false}
    >
      {/* OTS Badge */}
      {otsAchieved && (
        <div className="p-4">
          <OTSBadge />
        </div>
      )}

      {/* Stats */}
      {logs.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-600 dark:text-gray-400">Toplam:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {logs.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600 dark:text-green-400">Başarılı:</span>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {successCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-600 dark:text-red-400">Hata:</span>
              <span className="font-semibold text-red-700 dark:text-red-300">
                {errorCount}
              </span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600 dark:text-gray-400">Bekliyor:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {pendingCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              Henüz log yok. Reklam yüklendiğinde log'lar burada görünecek.
            </p>
          </div>
        ) : (
          <div>
            {/* Reverse order (son log üstte) */}
            {[...logs].reverse().map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
