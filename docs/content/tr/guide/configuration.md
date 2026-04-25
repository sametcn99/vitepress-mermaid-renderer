---
sidebarDepth: 2
---

# Yapılandırma

`createMermaidRenderer()` Mermaid runtime seçeneklerini alır ve paylaşılan
renderer instance’ını döndürür. Araç çubuğu davranışı `setToolbar()` ile ayrı
yapılandırılır; çok dilli VitePress siteleri için locale uyumlu metinler de
burada tanımlanır.

## Temel renderer seçenekleri

```typescript
const mermaidRenderer = createMermaidRenderer({
  theme: isDark.value ? 'dark' : 'forest',
  startOnLoad: false,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  sequence: {
    diagramMarginX: 60,
    diagramMarginY: 20,
  },
  gantt: {
    axisFormatter: (value) =>
      value.toLocaleString('tr-TR', { timeZone: 'UTC' }),
  },
  securityLevel: 'loose',
});
```

| Seçenek                  | Amaç                                                                                                       |
| :----------------------- | :--------------------------------------------------------------------------------------------------------- |
| `theme`                  | Mermaid’in yerleşik temaları arasında geçiş yapar. VitePress `isDark` sinyali site temasıyla uyumu korur.  |
| `startOnLoad`            | Renderer yaşam döngüsünü kullanırken `false` bırakın; render işlemi eklenti tarafından yönetilir.          |
| `flowchart` / `sequence` | Resmi Mermaid config şemasındaki seçenekleri tip güvenliğiyle yansıtır.                                    |
| `gantt`                  | Proje zaman çizelgelerinde tarih biçimlendirme veya eksen görünürlüğünü özelleştirir.                      |
| `securityLevel`          | `mermaid.initialize()` içine geçirilen Mermaid güvenlik modudur. İçerik politikanıza uygun seviyeyi seçin. |

`createMermaidRenderer()` yeni bir Mermaid config ile tekrar çağrıldığında
mevcut singleton config’i güncellenir ve mount edilmiş diyagramlara runtime
update gönderilir.

## Tema farkındalığı

```typescript
watch(
  () => isDark.value,
  () => {
    createMermaidRenderer({
      theme: isDark.value ? 'dark' : 'forest',
    });
  },
);
```

Site açık ve koyu tema arasında geçiş yaptığında renderer’ı yeni Mermaid
temasıyla tekrar çağırın. Mount edilmiş diyagramlar config update eventini
dinler ve aktif paletle yeniden render edilir.

## Locale uyumlu araç çubuğu

```typescript
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

Root İngilizce locale, yerleşik varsayılan metinleri kullanabilir. Türkçe ve
Çince sayfalar VitePress `localeIndex` değerlerini geçirerek ilgili tabloyu
çözer.

## Dışa aktarma ve erişilebilirlik

- `downloadFormat`, indirme aksiyonunun `svg`, `png` veya `jpg` üretmesini
  belirler.
- `fullscreenMode`, native Fullscreen API için `browser` ya da sayfa içi overlay
  için `dialog` olabilir.
- `showLanguageLabel`, VitePress’in orijinal `mermaid` kod bloğu etiketinin
  görünür kalıp kalmayacağını kontrol eder.
- `resetView`, `copyCode` ve erişilebilir düğme etiketleri klavye ve ekran
  okuyucu akışları için önemlidir.

Tek renderer instance’ı üzerinden yapılandırma yapmak, diyagramları sayfalar,
breakpoint’ler, temalar ve diller arasında tutarlı tutar. Tüm seçenekler için
[Yapılandırma Tipleri](./types.md) sayfasına bakın.
