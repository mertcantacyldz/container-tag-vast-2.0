/**
 * Quartile Tracker - Video Event Tracking
 *
 * Bu sınıf video oynatımı sırasında quartile event'lerini takip eder
 * ve uygun zamanlarda tracking URL'lerini fire eder.
 *
 * QUARTILES:
 * - Start: Video başladı (0%)
 * - FirstQuartile: %25
 * - Midpoint: %50
 * - ThirdQuartile: %75
 * - Complete: %100
 *
 * ÖZELLIKLER:
 * - timeupdate event ile tracking
 * - ±0.5s tolerans (user seek durumları için)
 * - Fire-once guarantee (her quartile sadece bir kez)
 * - Progress-based detection (seek forward/backward uyumlu)
 * - Ek eventler: pause, resume, mute, unmute, fullscreen
 */

import type { QuartileTrackerConfig, VastEventType, QuartileThreshold } from './types';

export class QuartileTracker {
  // Konfigürasyon
  private videoElement: HTMLVideoElement;
  private trackingUrls: Record<VastEventType, string[]>;
  private onFire: (eventType: VastEventType, urls: string[]) => void;
  private tolerance: number;

  // Quartile thresholds
  private readonly quartiles: QuartileThreshold[] = [
    { event: 'Start', percent: 0, fired: false },
    { event: 'FirstQuartile', percent: 0.25, fired: false },
    { event: 'Midpoint', percent: 0.5, fired: false },
    { event: 'ThirdQuartile', percent: 0.75, fired: false },
    { event: 'Complete', percent: 1, fired: false },
  ];

  // Event listeners (cleanup için saklıyoruz)
  private boundHandlers: {
    timeupdate: () => void;
    ended: () => void;
    pause: () => void;
    play: () => void;
    volumechange: () => void;
  };

  // State
  private wasPlaying: boolean = false;
  private wasMuted: boolean = false;

  constructor(config: QuartileTrackerConfig) {
    this.videoElement = config.videoElement;
    this.trackingUrls = config.trackingUrls;
    this.onFire = config.onFire;
    this.tolerance = config.tolerance || 0.5; // Default 0.5 saniye

    // Event handler'ları bind et (cleanup için)
    this.boundHandlers = {
      timeupdate: this.handleTimeUpdate.bind(this),
      ended: this.handleEnded.bind(this),
      pause: this.handlePause.bind(this),
      play: this.handlePlay.bind(this),
      volumechange: this.handleVolumeChange.bind(this),
    };
  }

  /**
   * Tracking'i başlat (event listener'ları ekle)
   */
  init(): void {
    console.log('[QuartileTracker] Initializing quartile tracking');

    // Video event'lerini dinle
    this.videoElement.addEventListener('timeupdate', this.boundHandlers.timeupdate);
    this.videoElement.addEventListener('ended', this.boundHandlers.ended);
    this.videoElement.addEventListener('pause', this.boundHandlers.pause);
    this.videoElement.addEventListener('play', this.boundHandlers.play);
    this.videoElement.addEventListener('volumechange', this.boundHandlers.volumechange);

    // Initial state
    this.wasPlaying = !this.videoElement.paused;
    this.wasMuted = this.videoElement.muted;
  }

  /**
   * timeupdate event handler - Her ~250ms'de fire edilir
   */
  private handleTimeUpdate(): void {
    const currentTime = this.videoElement.currentTime;
    const duration = this.videoElement.duration;

    // Duration henüz yüklenmemişse skip et
    if (!duration || duration === 0 || isNaN(duration)) {
      return;
    }

    // Progress hesapla (0-1 arası)
    const progress = currentTime / duration;

    // Her quartile'ı kontrol et
    this.quartiles.forEach((quartile) => {
      if (!quartile.fired) {
        // Target time hesapla
        const targetTime = duration * quartile.percent;

        // Tolerans kontrolü: targetTime ± tolerance aralığında mıyız?
        const isWithinTolerance = Math.abs(currentTime - targetTime) <= this.tolerance;

        // Veya threshold'u geçtik mi? (seek durumları için)
        const hasPassedThreshold = progress >= quartile.percent;

        if (isWithinTolerance || hasPassedThreshold) {
          this.fireQuartile(quartile);
        }
      }
    });
  }

  /**
   * ended event handler - Video bittiğinde
   */
  private handleEnded(): void {
    console.log('[QuartileTracker] Video ended');

    // Complete event'ini fire et (henüz fire edilmemişse)
    const completeQuartile = this.quartiles.find((q) => q.event === 'Complete');
    if (completeQuartile && !completeQuartile.fired) {
      this.fireQuartile(completeQuartile);
    }
  }

  /**
   * pause event handler
   */
  private handlePause(): void {
    if (this.wasPlaying) {
      console.log('[QuartileTracker] Video paused');
      this.fireEvent('Pause');
      this.wasPlaying = false;
    }
  }

  /**
   * play event handler
   */
  private handlePlay(): void {
    if (!this.wasPlaying && this.videoElement.currentTime > 0) {
      // Resume (ilk play değil, resume)
      console.log('[QuartileTracker] Video resumed');
      this.fireEvent('Resume');
    }
    this.wasPlaying = true;
  }

  /**
   * volumechange event handler
   */
  private handleVolumeChange(): void {
    const isMuted = this.videoElement.muted;

    if (isMuted !== this.wasMuted) {
      if (isMuted) {
        console.log('[QuartileTracker] Video muted');
        this.fireEvent('Mute');
      } else {
        console.log('[QuartileTracker] Video unmuted');
        this.fireEvent('Unmute');
      }
      this.wasMuted = isMuted;
    }
  }

  /**
   * Quartile fire et
   */
  private fireQuartile(quartile: QuartileThreshold): void {
    console.log(`[QuartileTracker] Firing ${quartile.event} (${(quartile.percent * 100).toFixed(0)}%)`);

    // Fired flag'i set et
    quartile.fired = true;

    // Tracking URL'lerini fire et
    this.fireEvent(quartile.event);
  }

  /**
   * Generic event fire et
   */
  private fireEvent(eventType: VastEventType): void {
    const urls = this.trackingUrls[eventType] || [];

    if (urls.length > 0) {
      console.log(`[QuartileTracker] Firing ${urls.length} trackers for ${eventType}`);
      this.onFire(eventType, urls);
    }
  }

  /**
   * Tracking'i durdur ve temizle
   */
  destroy(): void {
    console.log('[QuartileTracker] Destroying quartile tracker');

    // Event listener'ları kaldır
    this.videoElement.removeEventListener('timeupdate', this.boundHandlers.timeupdate);
    this.videoElement.removeEventListener('ended', this.boundHandlers.ended);
    this.videoElement.removeEventListener('pause', this.boundHandlers.pause);
    this.videoElement.removeEventListener('play', this.boundHandlers.play);
    this.videoElement.removeEventListener('volumechange', this.boundHandlers.volumechange);

    // Quartile state'i reset et
    this.quartiles.forEach((q) => {
      q.fired = false;
    });
  }

}
