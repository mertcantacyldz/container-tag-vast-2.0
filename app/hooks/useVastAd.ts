/**
 * useVastAd Hook - React Integration for VAST Ad Engine
 *
 * Bu hook, AdContainer'ı React component lifecycle'ına entegre eder.
 * State management ve lifecycle handling sağlar.
 *
 * KULLANIM:
 * ```tsx
 * const {
 *   videoRef,
 *   logs,
 *   isLoading,
 *   error,
 *   otsAchieved,
 *   loadAd,
 *   clearLogs,
 * } = useVastAd();
 *
 * // Video element'e ref ver
 * <video ref={videoRef} />
 *
 * // Reklam yükle
 * loadAd('https://example.com/vast.xml', { type: 'cors-anywhere' });
 * ```
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { AdContainer } from '~/lib/vast';
import type { TrackingLog, ProxyConfig } from '~/lib/vast';

interface UseVastAdReturn {
  /** Video element ref (video tag'ine verilmeli) */
  videoRef: React.RefObject<HTMLVideoElement | null>;

  /** Tracking log'ları */
  logs: TrackingLog[];

  /** Yükleniyor mu? */
  isLoading: boolean;

  /** Hata mesajı (varsa) */
  error: string | null;

  /** OTS (Opportunity to See) başarıyla gerçekleşti mi? */
  otsAchieved: boolean;

  /** Reklam yükle */
  loadAd: (vastUrl: string, proxyConfig?: ProxyConfig) => Promise<void>;

  /** Log'ları temizle */
  clearLogs: () => void;
}

/**
 * VAST Ad management hook
 */
export function useVastAd(): UseVastAdReturn {
  // Video element ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // AdContainer instance ref
  const adContainerRef = useRef<AdContainer | null>(null);

  // State
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otsAchieved, setOtsAchieved] = useState(false);

  /**
   * Logger callback - AdContainer'dan gelen log'ları yakala
   * useCallback ile memoize ediyoruz (her render'da yeni fonksiyon oluşmasın)
   */
  const loggerCallback = useCallback((log: TrackingLog) => {
    console.log('[useVastAd] Logger callback:', log);

    setLogs((prevLogs) => {
      // Aynı ID'ye sahip log var mı? (update durumu)
      const existingIndex = prevLogs.findIndex((l) => l.id === log.id);

      if (existingIndex >= 0) {
        // Mevcut log'u güncelle
        const updatedLogs = [...prevLogs];
        updatedLogs[existingIndex] = log;
        return updatedLogs;
      } else {
        // Yeni log ekle
        return [...prevLogs, log];
      }
    });

    // OTS kontrolü (Complete event success)
    if (log.eventType === 'Complete' && log.status === 'success') {
      console.log('[useVastAd] OTS achieved! 🎉');
      setOtsAchieved(true);
    }
  }, []);

  /**
   * Reklam yükle
   */
  const loadAd = useCallback(
    async (vastUrl: string, proxyConfig?: ProxyConfig) => {
      console.log('[useVastAd] Loading ad:', vastUrl);

      // Video element hazır değilse hata ver
      if (!videoRef.current) {
        const errorMsg = 'Video element not ready';
        console.error('[useVastAd] Error:', errorMsg);
        setError(errorMsg);
        return;
      }

      // Önceki AdContainer'ı temizle
      if (adContainerRef.current) {
        console.log('[useVastAd] Destroying previous ad container');
        adContainerRef.current.destroy();
        adContainerRef.current = null;
      }

      // State reset
      setLogs([]);
      setError(null);
      setOtsAchieved(false);
      setIsLoading(true);

      try {
        // Yeni AdContainer oluştur
        const adContainer = new AdContainer({
          vastUrl,
          videoElement: videoRef.current,
          loggerCallback,
          proxyConfig,
          maxWrapperDepth: 3,
          quartileTolerance: 0.5,
          autoPlay: true,
          debug: true, // Debug mode açık (production'da false yapılabilir)
        });

        // Initialize et (VAST parse + video load)
        await adContainer.init();

        // Reklam var mı kontrol et
        if (!adContainer.hasAd()) {
          throw new Error('No ad found in VAST response');
        }

        // Başarılı, ref'e kaydet
        adContainerRef.current = adContainer;

        console.log('[useVastAd] Ad loaded successfully');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load ad';
        console.error('[useVastAd] Load error:', errorMsg);

        // Empty VAST → 404 handling
        if (
          errorMsg.includes('No Ad element found') ||
          errorMsg.includes('No ad available') ||
          errorMsg.includes('No ad found')
        ) {
          setError('404: No ad available in VAST response');
        } else {
          setError(errorMsg);
        }

        // Cleanup
        if (adContainerRef.current) {
          adContainerRef.current.destroy();
          adContainerRef.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loggerCallback]
  );

  /**
   * Log'ları temizle
   */
  const clearLogs = useCallback(() => {
    console.log('[useVastAd] Clearing logs');
    setLogs([]);
    setOtsAchieved(false);
  }, []);

  /**
   * Cleanup on unmount
   * Component unmount olduğunda AdContainer'ı temizle
   */
  useEffect(() => {
    return () => {
      console.log('[useVastAd] Cleanup on unmount');
      if (adContainerRef.current) {
        adContainerRef.current.destroy();
        adContainerRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    logs,
    isLoading,
    error,
    otsAchieved,
    loadAd,
    clearLogs,
  };
}
