/**
 * Control Panel - VAST URL ve Proxy Kontrolleri
 *
 * Kullanıcının VAST URL girişi yapması ve proxy ayarlarını yapması için panel
 */

import { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { ProxyType, ProxyConfig } from '~/lib/vast';

interface ControlPanelProps {
  /** Load Ad callback */
  onLoadAd: (vastUrl: string, proxyConfig: ProxyConfig) => void;

  /** Yükleniyor durumu */
  isLoading: boolean;
}

export function ControlPanel({ onLoadAd, isLoading }: ControlPanelProps) {
  // Form state
  const [vastUrl, setVastUrl] = useState('');
  const [proxyType, setProxyType] = useState<ProxyType>('none');
  const [customProxyUrl, setCustomProxyUrl] = useState('');

  // Proxy options
  const proxyOptions = [
    { value: 'none', label: 'Proxy Yok (Direct)' },
    { value: 'cors-anywhere', label: 'cors-anywhere (Public)' },
    { value: 'allorigins', label: 'allorigins (Public)' },
    { value: 'custom', label: 'Custom Proxy' },
  ];

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vastUrl.trim()) {
      alert('Lütfen VAST URL girin');
      return;
    }

    // Proxy config oluştur
    const proxyConfig: ProxyConfig = {
      type: proxyType,
      customUrl: proxyType === 'custom' ? customProxyUrl : undefined,
    };

    // Callback'i çağır
    onLoadAd(vastUrl, proxyConfig);
  };

  return (
    <Card title="Reklam Yükle">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* VAST URL Input */}
        <Input
          label="VAST URL"
          type="url"
          placeholder="https://example.com/vast.xml"
          value={vastUrl}
          onChange={(e) => setVastUrl(e.target.value)}
          disabled={isLoading}
          required
        />

        {/* Proxy Type Select */}
        <Select
          label="Proxy Ayarı"
          options={proxyOptions}
          value={proxyType}
          onChange={(e) => setProxyType(e.target.value as ProxyType)}
          disabled={isLoading}
        />

        {/* Custom Proxy URL (conditional) */}
        {proxyType === 'custom' && (
          <Input
            label="Custom Proxy URL"
            type="url"
            placeholder="https://your-proxy.com"
            value={customProxyUrl}
            onChange={(e) => setCustomProxyUrl(e.target.value)}
            disabled={isLoading}
          />
        )}

        {/* Proxy Info */}
        {proxyType !== 'none' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Proxy aktif:</strong> Tüm istekler {proxyType === 'cors-anywhere' && 'cors-anywhere.herokuapp.com'}
              {proxyType === 'allorigins' && 'allorigins.win'}
              {proxyType === 'custom' && 'custom proxy'} üzerinden gönderilecek.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          Reklamı Yükle
        </Button>

        {/* Test URL'leri (Yardımcı) */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Test VAST URL'leri:
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() =>
                setVastUrl(
                  'https://raw.githubusercontent.com/InteractiveAdvertisingBureau/VAST_Samples/master/VAST%202.0%20Samples/Inline_Linear_Tag-test.xml'
                )
              }
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline block"
            >
              IAB VAST 2.0 Sample (Inline Linear)
            </button>
          </div>
        </div>
      </form>
    </Card>
  );
}
