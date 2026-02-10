/**
 * Home Route - VAST 2.0 Ad Engine Dashboard
 *
 * Ana dashboard sayfası. VAST reklamlarını test etmek için kullanılır.
 *
 * PHASE 4 FEATURES:
 * - Auto-play: Query parameter ile otomatik video yükleme
 * - 404 Handling: Empty VAST için HTTP 404 status code
 * - Dev Mode: Query parameter yoksa ControlPanel göster
 */

import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { useVastAd } from "../hooks/useVastAd";
import { ControlPanel } from "../components/vast-dashboard/ControlPanel";
import { VideoPlayer } from "../components/vast-dashboard/VideoPlayer";
import { TrafficLog } from "../components/vast-dashboard/TrafficLog";
import type { ProxyConfig } from "~/lib/vast";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "VAST 2.0 Ad Engine Dashboard" },
    { name: "description", content: "Test and debug VAST advertising integrations" },
  ];
}

/**
 * Server-side loader - VAST validation ve 404 handling
 *
 * Query parameter'dan vastUrl varsa server-side fetch edip validate eder.
 * VAST boşsa (no <Ad> element) HTTP 404 response döner.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const fullSearch = url.search; // "?vastUrl=...&t=2"
  const rawVastUrl = fullSearch.split('vastUrl=')[1];

  // Query parameter yoksa normal render (dev mode)
  if (!rawVastUrl) {
    return { validated: false };
  }

  // DECODE et! Browser encode ederek gönderiy or
  const vastUrl = decodeURIComponent(rawVastUrl);
  console.log('[Loader] Decoded VAST URL:', vastUrl);

  try {
    console.log('[Loader] Validating VAST URL:', vastUrl);

    // VAST XML fetch et
    const response = await fetch(vastUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': request.url,
      },
      cache: 'no-cache',
    });

    //Fetch başarısız ise 404 throw et
    if (!response.ok) {
      console.log('[Loader] Fetch failed - Throwing 404');
      throw new Response("VAST URL could not be fetched", {
        status: 404,
        statusText: "Not Found",
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const xmlText = await response.text()

    console.log(xmlText, "XML")
    console.log('[Loader] XML fetched, length:', xmlText.length);

    // XML parse et - <Ad> elementi kontrolü
    // Regex ile daha esnek kontrol: <Ad>, <Ad >, <Ad\n>, <ad>, vs.
    const hasAdElement = /<Ad[\s>]/i.test(xmlText);

    console.log('[Loader] Has Ad element:', hasAdElement);
    console.log('[Loader] XML preview:', xmlText.substring(0, 500));

    if (!hasAdElement) {
      console.log('[Loader] No ad found - Throwing 404');
      throw new Response("No ad available in VAST response", {
        status: 404,
        statusText: "Not Found",
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    console.log('[Loader] VAST validated successfully');
    return { validated: true, vastUrl };

  } catch (error) {
    // Response objesi ise direkt throw (404 döner)
    if (error instanceof Response) {
      console.log('[Loader] Re-throwing Response error');
      throw error;
    }

    // Network hataları için de 404 throw et
    console.error('[Loader] Network or parse error - Throwing 404:', error);
    throw new Response("VAST could not be loaded", {
      status: 404,
      statusText: "Not Found",
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}



export default function Home() {
  // VAST ad management hook
  const { videoRef, logs, isLoading, error, otsAchieved, loadAd, clearLogs } = useVastAd();

  // Client-side query parameter detection (SSR-safe)
  const [hasQueryParam, setHasQueryParam] = useState(false);

  // Auto-init on mount (query parameter varsa)
  useEffect(() => {
    // Client-only (SSR skip)
    if (typeof window === 'undefined') {
      console.log('[Home useEffect] SSR detected, skipping');
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const vastUrl = searchParams.get('vastUrl');

    console.log('[Home useEffect] Query param vastUrl:', vastUrl);

    if (!vastUrl) {
      console.log('[Home useEffect] No vastUrl query param, setting hasQueryParam to false');
      setHasQueryParam(false);
      return;
    }

    console.log('[Home useEffect] Setting hasQueryParam to true');
    setHasQueryParam(true);

    // HER ZAMAN interval kullan (ilk render'da videoRef null olabilir)
    console.log('[Home useEffect] Starting videoRef check interval...');
    const checkVideoRef = setInterval(() => {
      console.log('[Home useEffect interval] Checking videoRef...', videoRef.current);

      if (videoRef.current) {
        console.log('[Home useEffect interval] videoRef ready! Loading ad...');
        clearInterval(checkVideoRef);
        loadAd(vastUrl, { type: 'none' });
      }
    }, 100);

    // 5 saniye timeout
    const timeout = setTimeout(() => {
      console.error('[Home useEffect timeout] videoRef timeout - video element not ready after 5s');
      clearInterval(checkVideoRef);
    }, 5000);

    // Cleanup
    return () => {
      console.log('[Home useEffect cleanup] Clearing interval and timeout');
      clearInterval(checkVideoRef);
      clearTimeout(timeout);
    };
  }, []); // Sadece mount'ta bir kez çalış

  // Load ad handler (manuel test için)
  const handleLoadAd = (vastUrl: string, proxyConfig: ProxyConfig) => {
    console.log('[Dashboard] Loading ad:', vastUrl, 'with proxy:', proxyConfig);
    loadAd(vastUrl, proxyConfig);
  };

  if (hasQueryParam) {
    return (
      <div className="w-full  h-screen ">
        <VideoPlayer ref={videoRef} error={error} isLoading={isLoading} fullscreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            VAST 2.0 Ad Engine Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test ve debug VAST reklam entegrasyonları
          </p>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Control Panel + Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Panel - Sadece dev mode'da göster (query parameter yoksa) */}
            {!hasQueryParam && (
              <ControlPanel onLoadAd={handleLoadAd} isLoading={isLoading} />
            )}

            {/* Video Player */}
            <VideoPlayer ref={videoRef} error={error} isLoading={isLoading} />
          </div>

          {/* Right Column: Traffic Log */}
          <div className="lg:col-span-1">
            <TrafficLog logs={logs} otsAchieved={otsAchieved} onClear={clearLogs} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            VAST 2.0 Container Tag - Pure JavaScript Ad Engine with React Router v7
          </p>
        </footer>
      </div>
    </div>
  );
}
