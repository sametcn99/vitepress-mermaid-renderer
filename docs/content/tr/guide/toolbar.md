---
sidebarDepth: 2
---

# Araç Çubuğu Özelleştirme

Yerleşik araç çubuğu, sürüklenebilir diyagram yüzeyinin etrafına yakınlaştırma,
sıfırlama, tam ekran, indirme ve kopyalama kontrolleri ekler. Düğme
başlıklarını, erişilebilir etiketleri ve kopyalama başarı metnini
yerelleştirmeyi de destekler.

## Desktop, mobile ve fullscreen

```typescript
mermaidRenderer.setToolbar({
  showLanguageLabel: true,
  downloadFormat: 'svg',
  fullscreenMode: 'browser',
  desktop: {
    zoomIn: 'enabled',
    zoomOut: 'enabled',
    resetView: 'enabled',
    download: 'enabled',
    positions: { vertical: 'top', horizontal: 'right' },
  },
  mobile: {
    zoomIn: 'disabled',
    zoomOut: 'disabled',
    resetView: 'enabled',
    copyCode: 'enabled',
    positions: { vertical: 'bottom', horizontal: 'left' },
  },
  fullscreen: {
    zoomLevel: 'enabled',
    toggleFullscreen: 'enabled',
  },
});
```

- `fullscreenMode`, tam ekran deneyimini belirler: `browser` native Fullscreen
  API kullanır, `dialog` sayfa içi modal overlay açar.
- **Desktop** tüm kontrolleri gösterebilir çünkü fare ve klavye etkileşimi
  geniştir.
- **Mobile** genellikle yakınlaştırma düğmelerini gizler, sıfırlama ve kopyalama
  aksiyonlarını tutar.
- **Fullscreen** odak dostu kontrolleri ve zoom seviyesi bilgisini ayrı yönetir.

## Araç çubuğunu konumlandırma

`positions` alanı `vertical: top|bottom` ve `horizontal: left|right` değerlerini
destekler. Bu sayede kontrolleri diyagramın kritik bölgelerini kapatmayacak
köşelere taşıyabilirsiniz.

## Tooltip metinlerini yerelleştirme

Araç çubuğu varsayılan olarak İngilizce metinlerle gelir. VitePress’ten aktif
`localeIndex` değerini alın ve `setToolbar` içindeki `i18n` seçeneğine locale
bazlı tablo olarak geçin.

```typescript
import { useData } from 'vitepress';

const { localeIndex } = useData();

mermaidRenderer.setToolbar({
  i18n: {
    localeIndex: localeIndex.value,
    locales: {
      tr: {
        tooltips: {
          zoomIn: 'Yakınlaştır',
          zoomOut: 'Uzaklaştır',
          resetView: 'Görünümü sıfırla',
          copyCode: 'Kodu kopyala',
          copyCodeCopied: 'Kopyalandı',
          download: 'Diyagramı indir',
          toggleFullscreen: 'Tam ekranı aç/kapa',
        },
      },
      zh: {
        tooltips: {
          zoomIn: '放大',
          zoomOut: '缩小',
          resetView: '重置视图',
          copyCode: '复制代码',
          copyCodeCopied: '已复制',
          download: '下载图表',
          toggleFullscreen: '切换全屏',
        },
      },
    },
  },
});
```

Her metin anahtarı için çözüm sırası şöyledir:

1. `i18n.locales[localeIndex].tooltips[key]`
2. `i18n.tooltips[key]`
3. Yerleşik İngilizce varsayılan

Boş string değerleri her katmanda yok sayılır. Kopyalama düğmesinden sonra
görünen kısa başarı metni için `copyCodeCopied` anahtarını çevirin.

Her `setToolbar()` çağrısı `vitepress-mermaid:toolbar-updated` eventini
gönderir. Mount edilmiş diyagramlar bu eventi dinler ve SVG’yi yeniden mount
etmeden yeni araç çubuğu metinlerini uygular.

## Erişilebilirlik notları

- `showLanguageLabel` açık kaldığında ekran okuyucular Mermaid diyagram
  bağlamını daha kolay duyurur.
- Her breakpoint’te `resetView` bulundurmak, zoom veya drag sonrası güvenli bir
  geri dönüş sağlar.
- Mobilde fazla düğme yığmayın; `positions` ile kontrolleri diyagramın yoğun
  bölgelerinden uzaklaştırın.

Tüm tipler için [Yapılandırma Tipleri](./types.md) sayfasına bakın.
