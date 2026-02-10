/**
 * VAST 2.0 Ad Engine - Public API
 *
 * Bu dosya, VAST reklam motorunun public API'sini export eder.
 * Framework-agnostic olarak tasarlanmıştır.
 *
 * KULLANIM:
 * ```typescript
 * import { AdContainer } from '~/lib/vast';
 *
 * const container = new AdContainer({
 *   vastUrl: 'https://example.com/vast.xml',
 *   videoElement: videoRef.current,
 *   loggerCallback: (log) => setLogs(prev => [...prev, log]),
 *   proxyConfig: { type: 'cors-anywhere' },
 * });
 *
 * await container.init();
 * container.play();
 * ```
 */

// Main class
export { AdContainer } from './AdContainer';

// Types (React components'lerde kullanılacak)
export type {
  TrackingLog,
  ProxyType,
  ProxyConfig,
} from './types';
