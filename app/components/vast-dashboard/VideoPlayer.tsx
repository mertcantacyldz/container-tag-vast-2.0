/**
 * Video Player - VAST Reklam Oynatıcı
 *
 * Video element wrapper component
 */

import { forwardRef } from 'react';
import { Card } from '../ui/Card';

interface VideoPlayerProps {
  /** Hata mesajı (varsa) */
  error?: string | null;

  /** Yükleniyor durumu */
  isLoading?: boolean;

  /** Fullscreen mode (vastUrl query parameter varsa) */
  fullscreen?: boolean;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ error, isLoading, fullscreen }, ref) => {
    console.log('[VideoPlayer] Rendering with:', { error, isLoading, fullscreen, hasRef: !!ref });

    // Fullscreen mode: Sadece video (Card wrapper yok)
    if (fullscreen) {
      console.log('[VideoPlayer] Rendering fullscreen mode');
      return (
        <div className="relative w-full h-full bg-black" style={{ zIndex: 9999 }}>
          {/* Video Element */}
          <video
            ref={ref}
            className="w-full h-full"
            controls
            playsInline
            preload="metadata"
            muted
            style={{
              backgroundColor: 'black',
              objectFit: 'contain',
              display: 'block',
              position: 'relative',
              zIndex: 10000
            }}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <svg
                  className="animate-spin h-12 w-12 text-white mx-auto mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-white font-medium">VAST Yükleniyor...</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 p-6">
              <div className="text-center max-w-md">
                <svg
                  className="h-12 w-12 text-white mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">Hata Oluştu</h3>
                <p className="text-white text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Dev dashboard mode: Card wrapper ile aspect-video
    return (
      <Card title="Reklam Oynatıcı" padding={false}>
        <div className="relative aspect-video bg-black">
          {/* Video Element */}
          <video
            ref={ref}
            className="w-full h-full"
            controls
            playsInline
            preload="metadata"
            muted
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <svg
                  className="animate-spin h-12 w-12 text-white mx-auto mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-white font-medium">VAST Yükleniyor...</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 p-6">
              <div className="text-center max-w-md">
                <svg
                  className="h-12 w-12 text-white mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">Hata Oluştu</h3>
                <p className="text-white text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Info (placeholder for future features) */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Video kontrolleri: Oynat/Duraklat, Ses, Tam Ekran
          </p>
        </div>
      </Card>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
