/**
 * VAST 2.0 Ad Engine - Type Definitions
 *
 * Bu dosya, VAST reklam motorunun tüm TypeScript tip tanımlarını içerir.
 * Framework-agnostic (React'a bağımlı değil) olarak tasarlanmıştır.
 */

// ==================== PROXY CONFIGURATION ====================

/**
 * Proxy tipi seçenekleri
 * - 'none': Proxy kullanma, direkt istek at
 * - 'cors-anywhere': cors-anywhere.herokuapp.com servisi
 * - 'allorigins': allorigins.win servisi
 * - 'custom': Kullanıcının kendi proxy URL'i
 */
export type ProxyType = 'none' | 'cors-anywhere' | 'allorigins' | 'custom';

/**
 * Proxy konfigürasyonu
 */
export interface ProxyConfig {
  /** Proxy tipi */
  type: ProxyType;

  /** Custom proxy kullanılıyorsa, proxy'nin base URL'i */
  customUrl?: string;
}

// ==================== VAST EVENT TYPES ====================

/**
 * VAST 2.0 standart event tipleri
 * Bu eventler video oynatımı sırasında fire edilir
 */
export type VastEventType =
  | 'Impression'      // Reklam gösterildi
  | 'Start'           // Video başladı (0%)
  | 'FirstQuartile'   // İlk çeyrek (%25)
  | 'Midpoint'        // Yarı nokta (%50)
  | 'ThirdQuartile'   // Üçüncü çeyrek (%75)
  | 'Complete'        // Video tamamlandı (%100)
  | 'Pause'           // Video durakladı
  | 'Resume'          // Video devam etti
  | 'Mute'            // Ses kapatıldı
  | 'Unmute'          // Ses açıldı
  | 'Fullscreen'      // Tam ekran yapıldı
  | 'ExitFullscreen'  // Tam ekrandan çıkıldı
  | 'Skip'            // Reklam atlandı
  | 'Click'           // Reklama tıklandı
  | 'Error';          // Hata oluştu

// ==================== TRACKING LOG ====================

/**
 * Tracker request'in durumu
 */
export type TrackingStatus = 'pending' | 'success' | 'error';

/**
 * Tracking log kaydı
 * Her tracker request için bir log oluşturulur
 */
export interface TrackingLog {
  /** Benzersiz log ID'si */
  id: string;

  /** Log oluşturulma zamanı */
  timestamp: Date;

  /** VAST event tipi */
  eventType: VastEventType;

  /** Fire edilen tracker URL'i */
  trackerUrl: string;

  /** Request durumu */
  status: TrackingStatus;

  /** HTTP status code (başarılıysa) */
  statusCode?: number;

  /** Hata mesajı (hata durumunda) */
  errorMessage?: string;
}

// ==================== VAST XML PARSING ====================

/**
 * MediaFile bilgisi
 * VAST XML'inden çıkarılan video dosyası bilgisi
 */
export interface MediaFile {
  /** Video dosyasının URL'i */
  url: string;

  /** MIME type (örn: 'video/mp4', 'video/webm') */
  type: string;

  /** Video genişliği (px) */
  width: number;

  /** Video yüksekliği (px) */
  height: number;

  /** Bitrate (kbps) */
  bitrate: number;

  /** Codec bilgisi (optional) */
  codec?: string;

  /** Delivery method ('progressive' veya 'streaming') */
  delivery?: string;
}

/**
 * Parse edilmiş VAST bilgisi
 * VastParser'ın döndürdüğü sonuç
 */
export interface ParsedVast {
  /** Video dosyaları listesi */
  mediaFiles: MediaFile[];

  /** Impression tracker URL'leri */
  impressions: string[];

  /** Event bazında tracking URL'leri */
  tracking: Record<VastEventType, string[]>;

  /** Click-through URL (reklama tıklandığında gidilecek sayfa) */
  clickThrough?: string;

  /** Click tracking URL'leri */
  clickTracking: string[];

  /** Reklam başlığı */
  adTitle?: string;

  /** Reklam açıklaması */
  adDescription?: string;

  /** Reklam süresi (saniye) */
  duration?: number;

  /** Skip offset (kaç saniye sonra atlanabilir) */
  skipOffset?: number;
}

// ==================== AD CONTAINER CONFIG ====================

/**
 * AdContainer sınıfının constructor parametreleri
 */
export interface AdContainerConfig {
  /** VAST XML URL'i */
  vastUrl: string;

  /** HTML video elementi */
  videoElement: HTMLVideoElement;

  /** Logger callback fonksiyonu - Her tracker fire'ında çağrılır */
  loggerCallback: (log: TrackingLog) => void;

  /** Proxy konfigürasyonu */
  proxyConfig?: ProxyConfig;

  /** Maksimum wrapper depth (default: 3) */
  maxWrapperDepth?: number;

  /** Quartile toleransı saniye cinsinden (default: 0.5) */
  quartileTolerance?: number;

  /** Auto-play etkinleştirilsin mi (default: true) */
  autoPlay?: boolean;

  /** Debug mode (console'a detaylı log yazsın mı) */
  debug?: boolean;
}

// ==================== AD CONTAINER STATE ====================

/**
 * AdContainer'ın iç state'i
 */
export interface AdContainerState {
  /** Ad yüklendi mi? */
  isReady: boolean;

  /** Ad var mı? */
  hasAd: boolean;

  /** Şu anda oynuyor mu? */
  isPlaying: boolean;

  /** Hata oluştu mu? */
  hasError: boolean;

  /** Hata mesajı */
  errorMessage?: string;

  /** Parse edilmiş VAST bilgisi */
  parsedVast?: ParsedVast;
}

// ==================== QUARTILE TRACKING ====================

/**
 * Quartile threshold bilgisi
 */
export interface QuartileThreshold {
  /** Event tipi */
  event: VastEventType;

  /** Video progress yüzdesi (0-1 arası) */
  percent: number;

  /** Fire edildi mi? */
  fired: boolean;
}

/**
 * Quartile tracker konfigürasyonu
 */
export interface QuartileTrackerConfig {
  /** HTML video elementi */
  videoElement: HTMLVideoElement;

  /** Tracking URL'leri (event tipine göre) */
  trackingUrls: Record<VastEventType, string[]>;

  /** Tracker firing callback */
  onFire: (eventType: VastEventType, urls: string[]) => void;

  /** Tolerans (saniye cinsinden) */
  tolerance?: number;
}

// ==================== TRACKING MANAGER CONFIG ====================

/**
 * TrackingManager konfigürasyonu
 */
export interface TrackingManagerConfig {
  /** Logger callback */
  loggerCallback: (log: TrackingLog) => void;

  /** Proxy konfigürasyonu */
  proxyConfig?: ProxyConfig;

  /** Debug mode */
  debug?: boolean;
}

// ==================== VAST PARSER CONFIG ====================

/**
 * VastParser konfigürasyonu
 */
export interface VastParserConfig {
  /** Proxy konfigürasyonu */
  proxyConfig?: ProxyConfig;

  /** Maksimum wrapper depth */
  maxWrapperDepth?: number;

  /** Debug mode */
  debug?: boolean;
}

// ==================== ERROR TYPES ====================

/**
 * VAST error kodları (VAST 2.0 spec'e göre)
 */
export enum VastErrorCode {
  XML_PARSING_ERROR = 100,
  VAST_SCHEMA_VALIDATION_ERROR = 101,
  VAST_VERSION_NOT_SUPPORTED = 102,
  TRAFFICKING_ERROR = 200,
  VIDEO_PLAYER_ERROR = 300,
  MEDIA_FILE_TIMEOUT = 402,
  MEDIA_FILE_NOT_FOUND = 403,
  MEDIA_FILE_TYPE_NOT_SUPPORTED = 405,
  WRAPPER_TIMEOUT = 301,
  WRAPPER_LIMIT_REACHED = 302,
  WRAPPER_NO_ADS = 303,
  GENERAL_LINEAR_ERROR = 400,
  UNDEFINED_ERROR = 900,
}

/**
 * VAST Error detayı
 */
export interface VastError {
  /** Error kodu */
  code: VastErrorCode;

  /** Error mesajı */
  message: string;

  /** Ek detaylar */
  details?: string;

  /** Original error (varsa) */
  originalError?: Error;
}
