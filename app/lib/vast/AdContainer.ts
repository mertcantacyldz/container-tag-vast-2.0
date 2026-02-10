/**
 * Ad Container - VAST 2.0 Reklam Motoru (Main Orchestration Class)
 *
 * Bu sınıf VAST reklam motorunun ana sınıfıdır ve tüm bileşenleri orkestre eder.
 * Framework-agnostic olarak tasarlanmıştır (React, Vue, Angular'da kullanılabilir).
 *
 * KULLANIM:
 * ```typescript
 * const adContainer = new AdContainer({
 *   vastUrl: 'https://example.com/vast.xml',
 *   videoElement: document.querySelector('video'),
 *   loggerCallback: (log) => console.log(log),
 *   proxyConfig: { type: 'cors-anywhere' },
 * });
 *
 * await adContainer.init(); // VAST parse et
 * adContainer.play(); // Reklamı oynat
 * ```
 *
 * LIFECYCLE:
 * 1. Constructor: Config al, bileşenleri oluştur
 * 2. init(): VAST parse et, video src'yi set et
 * 3. play(): Video oynat, tracking başlat
 * 4. destroy(): Temizlik yap, event listener'ları kaldır
 */

import { VastParser } from './VastParser';
import { TrackingManager } from './TrackingManager';
import { QuartileTracker } from './QuartileTracker';
import type {
  AdContainerConfig,
  AdContainerState,
  ParsedVast,
} from './types';

export class AdContainer {
  // Konfigürasyon
  private config: AdContainerConfig;

  // Bileşenler
  private vastParser: VastParser;
  private trackingManager: TrackingManager;
  private quartileTracker: QuartileTracker | null = null;

  // State
  private state: AdContainerState = {
    isReady: false,
    hasAd: false,
    isPlaying: false,
    hasError: false,
  };

  // Video element
  private videoElement: HTMLVideoElement;

  // Parse edilmiş VAST data
  private parsedVast: ParsedVast | null = null;

  constructor(config: AdContainerConfig) {
    this.config = {
      ...config,
      maxWrapperDepth: config.maxWrapperDepth || 3,
      quartileTolerance: config.quartileTolerance || 0.5,
      autoPlay: config.autoPlay !== false, // Default true
      debug: config.debug || false,
    };

    this.videoElement = config.videoElement;

    // VastParser oluştur
    this.vastParser = new VastParser({
      proxyConfig: config.proxyConfig,
      maxWrapperDepth: this.config.maxWrapperDepth,
      debug: this.config.debug,
    });

    // TrackingManager oluştur
    this.trackingManager = new TrackingManager({
      loggerCallback: config.loggerCallback,
      proxyConfig: config.proxyConfig,
      debug: this.config.debug,
    });

    this.log('[AdContainer] Created');
  }

  /**
   * AdContainer'ı initialize et
   * - VAST XML'i parse et
   * - MediaFile'ı seç ve video src'ye set et
   * - Impressions fire et
   */
  async init(): Promise<void> {
    this.log('[AdContainer] Initializing...');

    try {
      // 1. VAST parse et
      this.parsedVast = await this.vastParser.parse(this.config.vastUrl);
      this.log(`[AdContainer] VAST parsed successfully`);

      // 2. MediaFile var mı kontrol et
      if (!this.parsedVast.mediaFiles || this.parsedVast.mediaFiles.length === 0) {
        throw new Error('No MediaFiles found in VAST');
      }

      // 3. En uygun MediaFile'ı seç (VastParser zaten priority sıralaması yapmış)
      const selectedMedia = this.parsedVast.mediaFiles[0];
      this.log(`[AdContainer] Selected MediaFile: ${selectedMedia.type} - ${selectedMedia.url}`);

      // 4. Video src'yi set et
      this.videoElement.src = selectedMedia.url;

      // 5. Video metadata yüklenene kadar bekle
      await this.waitForVideoReady();

      // 6. QuartileTracker oluştur ve initialize et
      this.quartileTracker = new QuartileTracker({
        videoElement: this.videoElement,
        trackingUrls: this.parsedVast.tracking,
        onFire: (eventType, urls) => {
          this.trackingManager.fireTrackers(eventType, urls);
        },
        tolerance: this.config.quartileTolerance,
      });
      this.quartileTracker.init();

      // 7. State güncelle
      this.state = {
        isReady: true,
        hasAd: true,
        isPlaying: false,
        hasError: false,
        parsedVast: this.parsedVast,
      };

      this.log('[AdContainer] Initialization complete');

      // 8. Impressions fire et (reklam gösterildi)
      await this.trackingManager.fireImpressions(this.parsedVast.impressions);

      // 9. Auto-play etkinse oynat
      if (this.config.autoPlay) {
        this.play();
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Reklamı oynat
   */
  play(): void {
    if (!this.state.isReady) {
      this.log('[AdContainer] Cannot play: not ready', true);
      return;
    }

    this.log('[AdContainer] Playing ad');

    this.videoElement
      .play()
      .then(() => {
        this.state.isPlaying = true;
        this.log('[AdContainer] Playback started');
      })
      .catch((error) => {
        this.log(`[AdContainer] Playback failed: ${error.message}`, true);
        this.handleError(error);
      });
  }

  /**
   * AdContainer'ı destroy et ve temizle
   * - QuartileTracker'ı durdur
   * - Video src'yi temizle
   * - State'i reset et
   */
  destroy(): void {
    this.log('[AdContainer] Destroying...');

    // QuartileTracker'ı temizle
    if (this.quartileTracker) {
      this.quartileTracker.destroy();
      this.quartileTracker = null;
    }

    // Video'yu durdur ve temizle
    try {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement.load(); // Reset video element
    } catch (error) {
      // Video cleanup hatası önemli değil
      this.log(`[AdContainer] Video cleanup warning: ${error}`, false);
    }

    // State reset
    this.state = {
      isReady: false,
      hasAd: false,
      isPlaying: false,
      hasError: false,
    };

    this.parsedVast = null;

    this.log('[AdContainer] Destroyed');
  }

  /**
   * Reklam var mı?
   */
  hasAd(): boolean {
    return this.state.hasAd;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Video metadata'nın yüklenmesini bekle
   */
  private waitForVideoReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Video zaten ready ise direkt resolve
      if (this.videoElement.readyState >= 2) {
        // HAVE_CURRENT_DATA veya üzeri
        resolve();
        return;
      }

      // loadedmetadata event'ini bekle
      const onLoadedMetadata = () => {
        this.log('[AdContainer] Video metadata loaded');
        cleanup();
        resolve();
      };

      // error event'ini dinle
      const onError = () => {
        this.log('[AdContainer] Video loading error', true);
        cleanup();
        reject(new Error('Video loading failed'));
      };

      // Timeout (10 saniye)
      const timeout = setTimeout(() => {
        this.log('[AdContainer] Video loading timeout', true);
        cleanup();
        reject(new Error('Video loading timeout'));
      }, 10000);

      const cleanup = () => {
        this.videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        this.videoElement.removeEventListener('error', onError);
        clearTimeout(timeout);
      };

      this.videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      this.videoElement.addEventListener('error', onError);
    });
  }

  /**
   * Hata handling
   */
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    this.log(`[AdContainer] ERROR: ${errorMessage}`, true);

    this.state = {
      ...this.state,
      hasError: true,
      errorMessage,
    };

    // Error tracking URL'lerini fire et (varsa)
    if (this.parsedVast?.tracking['Error']) {
      this.trackingManager.fireTrackers('Error', this.parsedVast.tracking['Error']);
    }
  }

  /**
   * Debug log
   */
  private log(message: string, isError: boolean = false): void {
    if (this.config.debug) {
      if (isError) {
        console.error(message);
      } else {
        console.log(message);
      }
    }
  }

}
