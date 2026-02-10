# Container Tag - VAST 2.0 Ad Engine

**Production-ready VAST 2.0 reklam motoru.** Müşteri sitelerine script tag ile embed edilebilir.

---

## 🎯 Nasıl Çalışır?

Container Tag, müşterinin sitesinde **tamamen otomatik** çalışır:

1. Belirtilen div'i bulur (`#ad-slot-1`)
2. Otomatik olarak bir `<video>` HTML elementi oluşturur
3. VAST XML'den video URL'ini alır
4. Video element'in `src`'sine bu URL'i koyar
5. **Video'yu otomatik oynatır** (müşteri hiçbir şey yapmaz!)

---

## 🚀 Hızlı Başlangıç

### 1. Script'i Sayfaya Ekle

```html
<script src="https://your-cdn.com/container-tag.min.js"></script>
```

### 2. Reklam Alanı Oluştur

```html
<div id="ad-slot-1"></div>
```

### 3. Reklamı Başlat

```html
<script>
  ContainerTag.init({
    vastUrl: 'https://ad-server.com/vast.xml',
    containerId: 'ad-slot-1'
  });
</script>
```

**O kadar! Müşteri başka hiçbir şey yapmaz.**

---

## 📦 Runtime'da Ne Olur?

### ÖNCESİ:
```html
<div id="ad-slot-1"></div>
```

### SONRASI (Container Tag otomatik oluşturur):
```html
<div id="ad-slot-1">
  <video controls style="width:100%; height:auto">
    <!-- VAST'tan gelen video URL buraya gelir -->
  </video>
</div>
```

Video **otomatik oynar**, müşteri play butonuna basmaz bile!

---

## ⚙️ Konfigürasyon Seçenekleri

| Parametre | Tip | Zorunlu | Default | Açıklama |
|-----------|-----|---------|---------|----------|
| `vastUrl` | `string` | ✅ | - | VAST XML URL'i |
| `containerId` | `string` | ✅ | - | Reklam gösterilecek div ID'si |
| `proxyConfig` | `object` | ❌ | `{ type: 'none' }` | CORS proxy ayarları |
| `autoPlay` | `boolean` | ❌ | `true` | Otomatik oynatma |
| `debug` | `boolean` | ❌ | `false` | Console log'ları göster |
| `onComplete` | `function` | ❌ | - | Video bittiğinde çağrılır |
| `onError` | `function` | ❌ | - | Hata oluştuğunda çağrılır |

---

## 📝 Kullanım Örnekleri

### Basit Kullanım (Minimum Kod)

```html
<!DOCTYPE html>
<html>
<body>
  <!-- 1. Reklam alanı -->
  <div id="my-ad"></div>

  <!-- 2. Script yükle -->
  <script src="container-tag.min.js"></script>

  <!-- 3. Başlat -->
  <script>
    ContainerTag.init({
      vastUrl: 'https://example.com/vast.xml',
      containerId: 'my-ad'
    });
  </script>
</body>
</html>
```

### Gelişmiş Kullanım (Callback'ler)

```javascript
ContainerTag.init({
  vastUrl: 'https://example.com/vast.xml',
  containerId: 'my-ad',
  debug: true, // Console log'ları göster

  // Video tamamlandığında
  onComplete: function() {
    console.log('✓ Reklam tamamlandı!');
    // Örnek: Sonraki reklamı yükle
    loadNextAd();
  },

  // Hata oluştuğunda
  onError: function(error) {
    console.error('✗ Reklam hatası:', error);
    // Örnek: Fallback reklam göster
    showFallbackAd();
  }
});
```

### CORS Proxy Kullanımı

```javascript
ContainerTag.init({
  vastUrl: 'https://example.com/vast.xml',
  containerId: 'my-ad',
  proxyConfig: {
    type: 'cors-anywhere' // veya 'allorigins'
  }
});
```

### Manuel Oynatma (Auto-play Kapalı)

```javascript
ContainerTag.init({
  vastUrl: 'https://example.com/vast.xml',
  containerId: 'my-ad',
  autoPlay: false // Kullanıcı play butonuna bassın
});
```

---

## 🛠️ Build

### Development Build

```bash
# Test dashboard'u çalıştır
npm run dev

# http://localhost:5173 → Test UI
```

### Production Build

```bash
# Container Tag script'i oluştur
npm run build:lib

# Output:
# dist/container-tag.umd.js (minified production script)
# dist/container-tag.umd.js.map (source map)
```

### Her İkisini de Build Et

```bash
npm run build:all

# Hem test dashboard hem production script
```

---

## 🌐 Deployment

### 1. Build Sonrası

```bash
dist/
├── container-tag.umd.js      # Production script (~50KB)
└── container-tag.umd.js.map  # Source map
```

### 2. CDN'e Yükle

```bash
# Örnek: AWS S3 + CloudFront
aws s3 cp dist/container-tag.umd.js s3://your-bucket/container-tag.min.js
aws cloudfront create-invalidation \
  --distribution-id XXX \
  --paths "/container-tag.min.js"
```

### 3. Müşteri Sitesinde Kullan

```html
<!-- Production URL -->
<script src="https://cdn.your-domain.com/container-tag.min.js"></script>
<script>
  ContainerTag.init({
    vastUrl: 'https://ad-server.com/vast.xml',
    containerId: 'ad-slot'
  });
</script>
```

---

## 🧪 Test

### Local Test

1. Build oluştur:
```bash
npm run build:lib
```

2. Test HTML dosyası oluştur (`test.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Container Tag Test</title>
</head>
<body>
  <h1>Container Tag Test</h1>

  <!-- Reklam alanı -->
  <div id="test-ad" style="max-width:800px; margin:20px auto; border:2px solid #ccc; padding:20px;"></div>

  <!-- Container Tag -->
  <script src="dist/container-tag.umd.js"></script>
  <script>
    ContainerTag.init({
      vastUrl: 'http://localhost:5173/test-vast.xml',
      containerId: 'test-ad',
      debug: true, // Console log'ları göster
      onComplete: () => alert('✓ Reklam tamamlandı!'),
      onError: (err) => alert('✗ Hata: ' + err.message)
    });
  </script>
</body>
</html>
```

3. Browser'da aç:
```bash
open test.html
```

### Kontrol Listesi

- ✅ Video element otomatik oluşuyor mu?
- ✅ Video element container'a ekleniyor mu?
- ✅ VAST parse ediliyor mu?
- ✅ Video oynatılıyor mu?
- ✅ Tracking event'leri fire ediliyor mu?
- ✅ Debug log'ları console'da görünüyor mu?
- ✅ onComplete callback çalışıyor mu?
- ✅ onError callback çalışıyor mu?

---

## 🔧 Teknik Detaylar

### Format & Build

- **Format**: UMD (Universal Module Definition)
- **Minification**: Terser
- **Bundle Size**: ~50KB (minified), ~15KB (gzipped)
- **Browser Support**: Modern browsers (ES2020+)
- **Dependencies**: Zero (tamamen standalone)

### Özellikler

- ✅ **Framework-agnostic**: React, Vue, Angular'da kullanılabilir
- ✅ **Zero dependencies**: Hiçbir external library yok
- ✅ **Auto-play**: Video otomatik oynar (müşteri hiçbir şey yapmaz)
- ✅ **VAST 2.0**: Full support (Wrapper, InLine, Tracking)
- ✅ **Quartile tracking**: 0%, 25%, 50%, 75%, 100%
- ✅ **CORS proxy**: Built-in proxy support
- ✅ **TypeScript**: Global type declarations
- ✅ **Source maps**: Debugging için

### Mimari

```
Container Tag
├── DomManager (Video element creator)
├── ContainerTag (Main class)
└── AdContainer (VAST engine)
    ├── VastParser (XML parsing)
    ├── TrackingManager (HTTP tracker firing)
    └── QuartileTracker (Video event tracking)
```

---

## ❓ Troubleshooting

### Video Oynatılmıyor

**Sebep**: CORS hatası
**Çözüm**: Proxy kullan

```javascript
ContainerTag.init({
  vastUrl: '...',
  containerId: '...',
  proxyConfig: { type: 'cors-anywhere' }
});
```

### Container Bulunamıyor Hatası

**Sebep**: DOM henüz yüklenmemiş
**Çözüm**: Script'i `<body>` sonuna koy veya `DOMContentLoaded` bekle

```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    ContainerTag.init({ ... });
  });
</script>
```

### VAST Parse Hatası

**Sebep**: Geçersiz VAST XML
**Çözüm**: VAST URL'ini kontrol et, debug mode aç

```javascript
ContainerTag.init({
  vastUrl: '...',
  containerId: '...',
  debug: true, // Console'da detaylı log'lar görünür
  onError: (err) => console.error('VAST Error:', err)
});
```

---

## 📄 License

MIT

---

## 🤝 Support

Sorularınız için: [GitHub Issues](https://github.com/your-org/container-tag/issues)
