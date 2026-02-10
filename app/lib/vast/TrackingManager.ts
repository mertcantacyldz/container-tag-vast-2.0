/**
 * Tracking Manager - HTTP Tracker Firing System
 *
 * Bu sınıf VAST tracking URL'lerine HTTP request'leri fire eder.
 * Her request için log oluşturur ve logger callback'e bildirir.
 *
 * ÖZELLIKLER:
 * - Fire-and-forget tracking (no-cors mode)
 * - Real-time logging (pending -> success/error)
 * - Proxy support
 * - Parallel tracker firing
 * - Error handling ve retry (optional)
 */

import type {
  TrackingManagerConfig,
  TrackingLog,
  VastEventType,
  ProxyConfig,
} from './types';

export class TrackingManager {
  // Konfigürasyon
  private loggerCallback: (log: TrackingLog) => void;
  private proxyConfig: ProxyConfig;
  private debug: boolean;

  constructor(config: TrackingManagerConfig) {
    this.loggerCallback = config.loggerCallback;
    this.proxyConfig = config.proxyConfig || { type: 'none' };
    this.debug = config.debug || false;
  }

  /**
   * Tek bir tracker URL'e request fire et
   *
   * @param eventType - VAST event tipi (örn: 'Start', 'Complete')
   * @param trackerUrl - Fire edilecek tracker URL'i
   */
  async fireTracker(eventType: VastEventType, trackerUrl: string): Promise<void> {
    // Benzersiz log ID oluştur
    const logId = crypto.randomUUID();

    this.log(`[TrackingManager] Firing ${eventType} tracker: ${trackerUrl}`);

    // İlk log: pending state
    const pendingLog: TrackingLog = {
      id: logId,
      timestamp: new Date(),
      eventType,
      trackerUrl,
      status: 'pending',
    };

    // Logger'a pending log gönder
    this.loggerCallback(pendingLog);

    try {
      // Proxy uygula
      const proxiedUrl = this.applyProxy(trackerUrl);

      // HTTP request fire et
      const response = await fetch(proxiedUrl, {
        method: 'GET',
        mode: 'no-cors', // CORS hatalarını bypass et, fire-and-forget
        cache: 'no-cache',
        credentials: 'omit', // Cookie gönderme
      });

      // Success log
      // Not: no-cors mode'da response.status okunamaz, varsayılan olarak 0 döner
      const successLog: TrackingLog = {
        id: logId,
        timestamp: new Date(),
        eventType,
        trackerUrl,
        status: 'success',
        statusCode: response.status || 200, // no-cors'ta 0 gelir, 200 varsay
      };

      this.loggerCallback(successLog);
      this.log(`[TrackingManager] ✓ ${eventType} tracker succeeded`);
    } catch (error) {
      // Error log
      const errorLog: TrackingLog = {
        id: logId,
        timestamp: new Date(),
        eventType,
        trackerUrl,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      this.loggerCallback(errorLog);
      this.log(`[TrackingManager] ✗ ${eventType} tracker failed: ${errorLog.errorMessage}`, true);
    }
  }

  /**
   * Birden fazla tracker URL'i parallel olarak fire et
   *
   * @param eventType - VAST event tipi
   * @param trackerUrls - Fire edilecek tracker URL'leri array'i
   */
  async fireTrackers(eventType: VastEventType, trackerUrls: string[]): Promise<void> {
    if (trackerUrls.length === 0) {
      this.log(`[TrackingManager] No trackers to fire for ${eventType}`);
      return;
    }

    this.log(`[TrackingManager] Firing ${trackerUrls.length} trackers for ${eventType}`);

    // Tüm tracker'ları parallel fire et (Promise.all)
    // Her biri kendi error handling'ini yapıyor, birinin hatası diğerini etkilemez
    await Promise.all(
      trackerUrls.map((url) => this.fireTracker(eventType, url))
    );

    this.log(`[TrackingManager] All ${eventType} trackers fired`);
  }

  /**
   * İmpressions fire et (özel method, genelde ilk sırada fire edilir)
   *
   * @param impressionUrls - Impression tracker URL'leri
   */
  async fireImpressions(impressionUrls: string[]): Promise<void> {
    await this.fireTrackers('Impression', impressionUrls);
  }

  /**
   * Proxy uygula (config'e göre)
   */
  private applyProxy(url: string): string {
    switch (this.proxyConfig.type) {
      case 'none':
        return url;

      case 'cors-anywhere':
        return `https://cors-anywhere.herokuapp.com/${url}`;

      case 'allorigins':
        // allorigins URL encoding gerektirir
        return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

      case 'custom':
        if (this.proxyConfig.customUrl) {
          // Trailing slash kontrolü
          const baseUrl = this.proxyConfig.customUrl.endsWith('/')
            ? this.proxyConfig.customUrl
            : `${this.proxyConfig.customUrl}/`;
          return `${baseUrl}${url}`;
        }
        return url;

      default:
        return url;
    }
  }

  /**
   * Debug log
   */
  private log(message: string, isError: boolean = false): void {
    if (this.debug) {
      if (isError) {
        console.error(message);
      } else {
        console.log(message);
      }
    }
  }

}
