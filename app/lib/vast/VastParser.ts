/**
 * VAST Parser - XML Parsing ve Wrapper Resolution
 *
 * Bu sınıf VAST 2.0 XML'lerini parse eder, Wrapper zincirlerini çözer
 * ve final MediaFile ile tracking URL'lerini bulur.
 *
 * ÖZELLIKLER:
 * - Recursive wrapper resolution (max 3 depth)
 * - DOMParser ile XML parsing (kütüphane kullanmadan)
 * - MediaFile önceliklendirme (MP4 > WebM > Others)
 * - Tracking URL merging (wrapper + inline)
 * - Circular reference detection
 */

import type {
  VastParserConfig,
  ParsedVast,
  MediaFile,
  VastEventType,
  ProxyConfig,
  VastError,
} from './types';
import { VastErrorCode } from './types';

export class VastParser {
  // Konfigürasyon
  private proxyConfig: ProxyConfig;
  private maxWrapperDepth: number;
  private debug: boolean;

  // Visited URLs (circular reference detection için)
  private visitedUrls: Set<string> = new Set();

  constructor(config: VastParserConfig) {
    this.proxyConfig = config.proxyConfig || { type: 'none' };
    this.maxWrapperDepth = config.maxWrapperDepth || 3;
    this.debug = config.debug || false;
  }

  /**
   * VAST URL'ini parse et ve ParsedVast döndür
   *
   * @param vastUrl - VAST XML URL'i
   * @param depth - Şu anki wrapper depth (recursive calls için)
   * @returns ParsedVast objesi
   */
  async parse(vastUrl: string, depth: number = 0): Promise<ParsedVast> {
    this.log(`[VastParser] Parsing VAST at depth ${depth}: ${vastUrl}`);

    // Depth limit kontrolü
    if (depth >= this.maxWrapperDepth) {
      throw this.createError(
        VastErrorCode.WRAPPER_LIMIT_REACHED,
        `Maximum wrapper depth (${this.maxWrapperDepth}) exceeded`,
        `Current depth: ${depth}`
      );
    }

    // Circular reference kontrolü
    if (this.visitedUrls.has(vastUrl)) {
      throw this.createError(
        VastErrorCode.WRAPPER_LIMIT_REACHED,
        'Circular wrapper reference detected',
        `URL already visited: ${vastUrl}`
      );
    }
    this.visitedUrls.add(vastUrl);

    try {
      // 1. VAST XML'i fetch et
      const xmlText = await this.fetchVast(vastUrl);

      // 2. XML'i parse et
      const doc = this.parseXml(xmlText);

      // 3. Wrapper mı InLine mı kontrol et
      const ad = doc.querySelector('VAST > Ad');
      if (!ad) {
        throw this.createError(
          VastErrorCode.VAST_SCHEMA_VALIDATION_ERROR,
          'No Ad element found in VAST',
          'VAST XML must contain <VAST><Ad>...</Ad></VAST>'
        );
      }

      const wrapper = ad.querySelector('Wrapper');
      const inline = ad.querySelector('InLine');

      if (wrapper) {
        // Wrapper: Recursive çözüm
        return await this.parseWrapper(wrapper, depth);
      } else if (inline) {
        // InLine: Final reklam
        return this.parseInline(inline);
      } else {
        throw this.createError(
          VastErrorCode.VAST_SCHEMA_VALIDATION_ERROR,
          'Ad element must contain either Wrapper or InLine',
          'Found neither Wrapper nor InLine in Ad element'
        );
      }
    } catch (error) {
      // Hata durumunda rethrow
      if (error instanceof Error && 'code' in error) {
        throw error; // VastError zaten throw edilmiş
      }
      throw this.createError(
        VastErrorCode.UNDEFINED_ERROR,
        'VAST parsing failed',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * VAST XML'i network'ten fetch et (proxy ile)
   */
  private async fetchVast(vastUrl: string): Promise<string> {
    const proxiedUrl = this.applyProxy(vastUrl);
    this.log(`[VastParser] Fetching: ${proxiedUrl}`);

    try {
      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/xml, text/xml, */*',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      this.log(`[VastParser] Fetched ${xmlText.length} bytes`);

      return xmlText;
    } catch (error) {
      throw this.createError(
        VastErrorCode.TRAFFICKING_ERROR,
        'Failed to fetch VAST XML',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * XML string'ini DOM Document'e parse et
   */
  private parseXml(xmlText: string): Document {
    this.log('[VastParser] Parsing XML with DOMParser');

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Parse error kontrolü
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw this.createError(
        VastErrorCode.XML_PARSING_ERROR,
        'XML parsing failed',
        parserError.textContent || 'Unknown parser error'
      );
    }

    // VAST version check
    const vastElement = doc.querySelector('VAST');
    if (!vastElement) {
      throw this.createError(
        VastErrorCode.VAST_SCHEMA_VALIDATION_ERROR,
        'Root VAST element not found',
        'XML must have a <VAST> root element'
      );
    }

    const version = vastElement.getAttribute('version');
    this.log(`[VastParser] VAST version: ${version}`);

    return doc;
  }

  /**
   * Wrapper element'ini parse et ve nested VAST'ı çöz
   */
  private async parseWrapper(
    wrapper: Element,
    currentDepth: number
  ): Promise<ParsedVast> {
    this.log(`[VastParser] Parsing Wrapper at depth ${currentDepth}`);

    // Nested VAST URL'ini bul
    const vastAdTagUri = wrapper.querySelector('VASTAdTagURI')?.textContent?.trim();
    if (!vastAdTagUri) {
      throw this.createError(
        VastErrorCode.VAST_SCHEMA_VALIDATION_ERROR,
        'Wrapper missing VASTAdTagURI',
        'Wrapper element must contain VASTAdTagURI'
      );
    }

    // Wrapper'daki tracking URL'lerini çıkar
    const wrapperTracking = this.extractTracking(wrapper);
    const wrapperImpressions = this.extractImpressions(wrapper);

    // Nested VAST'ı recursive parse et
    const nestedVast = await this.parse(vastAdTagUri, currentDepth + 1);

    // Tracking URL'lerini merge et (wrapper + nested)
    return this.mergeVastData(
      {
        mediaFiles: [],
        impressions: wrapperImpressions,
        tracking: wrapperTracking,
        clickTracking: [],
      },
      nestedVast
    );
  }

  /**
   * InLine element'ini parse et (final reklam)
   */
  private parseInline(inline: Element): ParsedVast {
    this.log('[VastParser] Parsing InLine (final ad)');

    // Ad bilgileri
    const adTitle = inline.querySelector('AdTitle')?.textContent?.trim();
    const adDescription = inline.querySelector('Description')?.textContent?.trim();

    // Impression URL'leri
    const impressions = this.extractImpressions(inline);

    // Linear creative'i bul
    const linear = inline.querySelector('Creatives > Creative > Linear');
    if (!linear) {
      throw this.createError(
        VastErrorCode.GENERAL_LINEAR_ERROR,
        'No Linear creative found',
        'InLine must contain a Linear creative'
      );
    }

    // Duration
    const durationText = linear.querySelector('Duration')?.textContent?.trim();
    const duration = durationText ? this.parseDuration(durationText) : undefined;

    // Skip offset
    const skipOffsetAttr = linear.getAttribute('skipoffset');
    const skipOffset = skipOffsetAttr ? this.parseDuration(skipOffsetAttr) : undefined;

    // MediaFiles
    const mediaFiles = this.extractMediaFiles(linear);
    if (mediaFiles.length === 0) {
      throw this.createError(
        VastErrorCode.MEDIA_FILE_NOT_FOUND,
        'No MediaFiles found',
        'Linear creative must contain at least one MediaFile'
      );
    }

    // Tracking events
    const tracking = this.extractTracking(linear);

    // VideoClicks
    const clickThrough = linear.querySelector('VideoClicks > ClickThrough')?.textContent?.trim();
    const clickTracking = Array.from(linear.querySelectorAll('VideoClicks > ClickTracking'))
      .map((el) => el.textContent?.trim())
      .filter(Boolean) as string[];

    return {
      mediaFiles,
      impressions,
      tracking,
      clickThrough,
      clickTracking,
      adTitle,
      adDescription,
      duration,
      skipOffset,
    };
  }

  /**
   * MediaFile element'lerini extract et ve parse et
   */
  private extractMediaFiles(linear: Element): MediaFile[] {
    const mediaFileElements = Array.from(linear.querySelectorAll('MediaFiles > MediaFile'));

    const mediaFiles: MediaFile[] = mediaFileElements
      .map((el): MediaFile | null => {
        const url = el.textContent?.trim();
        if (!url) return null;

        return {
          url,
          type: el.getAttribute('type') || 'video/mp4',
          width: parseInt(el.getAttribute('width') || '0', 10),
          height: parseInt(el.getAttribute('height') || '0', 10),
          bitrate: parseInt(el.getAttribute('bitrate') || '0', 10),
          codec: el.getAttribute('codec') || undefined,
          delivery: el.getAttribute('delivery') || undefined,
        };
      })
      .filter((mf): mf is MediaFile => mf !== null);

    this.log(`[VastParser] Found ${mediaFiles.length} MediaFiles`);

    // MediaFile'ları önceliklendirerek sırala
    return this.prioritizeMediaFiles(mediaFiles);
  }

  /**
   * MediaFile'ları önceliklendirerek sırala
   * Öncelik: MP4 > WebM > Others, sonra bitrate
   */
  private prioritizeMediaFiles(mediaFiles: MediaFile[]): MediaFile[] {
    return mediaFiles.sort((a, b) => {
      // MIME type önceliği
      const aScore = this.getMediaTypeScore(a.type);
      const bScore = this.getMediaTypeScore(b.type);

      if (aScore !== bScore) {
        return bScore - aScore; // Yüksek score önce
      }

      // Aynı type ise bitrate'e göre sırala (yüksek bitrate önce)
      return b.bitrate - a.bitrate;
    });
  }

  /**
   * MediaFile type score'u (yüksek = daha iyi)
   */
  private getMediaTypeScore(type: string): number {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('mp4')) return 3;
    if (lowerType.includes('webm')) return 2;
    if (lowerType.includes('video')) return 1;

    return 0;
  }

  /**
   * Tracking event URL'lerini extract et
   */
  private extractTracking(element: Element): Record<VastEventType, string[]> {
    const tracking: Record<string, string[]> = {};

    const trackingElements = Array.from(element.querySelectorAll('TrackingEvents > Tracking'));

    trackingElements.forEach((el) => {
      const event = el.getAttribute('event');
      const url = el.textContent?.trim();

      if (event && url) {
        if (!tracking[event]) {
          tracking[event] = [];
        }
        tracking[event].push(url);
      }
    });

    this.log(`[VastParser] Extracted tracking for ${Object.keys(tracking).length} events`);

    return tracking as Record<VastEventType, string[]>;
  }

  /**
   * Impression URL'lerini extract et
   */
  private extractImpressions(element: Element): string[] {
    const impressions = Array.from(element.querySelectorAll('Impression'))
      .map((el) => el.textContent?.trim())
      .filter(Boolean) as string[];

    this.log(`[VastParser] Extracted ${impressions.length} impressions`);

    return impressions;
  }

  /**
   * Wrapper ve nested VAST verilerini merge et
   */
  private mergeVastData(wrapper: ParsedVast, nested: ParsedVast): ParsedVast {
    this.log('[VastParser] Merging wrapper and nested VAST data');

    // MediaFiles nested'den gelir
    const mediaFiles = nested.mediaFiles;

    // Impressions merge
    const impressions = [...wrapper.impressions, ...nested.impressions];

    // Tracking merge (event bazında array'leri birleştir)
    const tracking: Record<VastEventType, string[]> = { ...nested.tracking };
    Object.entries(wrapper.tracking).forEach(([event, urls]) => {
      const eventType = event as VastEventType;
      if (!tracking[eventType]) {
        tracking[eventType] = [];
      }
      tracking[eventType] = [...urls, ...tracking[eventType]];
    });

    // ClickTracking merge
    const clickTracking = [...wrapper.clickTracking, ...nested.clickTracking];

    return {
      ...nested, // nested'deki tüm alanları al
      mediaFiles,
      impressions,
      tracking,
      clickTracking,
    };
  }

  /**
   * Duration string'ini saniye'ye çevir (HH:MM:SS formatı)
   */
  private parseDuration(duration: string): number {
    const parts = duration.split(':').map((p) => parseInt(p, 10));

    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    // Fallback: sadece saniye olarak parse et
    return parseInt(duration, 10) || 0;
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
   * VastError oluştur
   */
  private createError(
    code: VastErrorCode,
    message: string,
    details?: string
  ): VastError & Error {
    const error = new Error(message) as VastError & Error;
    error.code = code;
    error.message = message;
    error.details = details;

    this.log(`[VastParser] ERROR: ${message} (code: ${code})`, true);
    if (details) {
      this.log(`[VastParser] Details: ${details}`, true);
    }

    return error;
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
