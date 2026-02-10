/**
 * OTS Badge - Opportunity to See Success Badge
 *
 * Reklam başarıyla tamamlandığında görünen başarı rozeti
 */

export function OTSBadge() {
  return (
    <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg animate-pulse">
      <div className="flex items-center gap-3">
        {/* Success Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Text */}
        <div>
          <h4 className="text-lg font-bold text-green-800 dark:text-green-200">
            ✅ OTS BAŞARILI
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            Reklam başarıyla tamamlandı (Opportunity to See)
          </p>
        </div>
      </div>
    </div>
  );
}
