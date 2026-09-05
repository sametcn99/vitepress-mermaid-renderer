---
sidebarDepth: 2
---

# Yapılandırma

`createMermaidRenderer()` Mermaid runtime seçeneklerini alır ve paylaşılan
renderer instance'ını döndürür. Araç çubuğu davranışı `setToolbar()` ile ayrı
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
  securityLevel: 'strict',
});
```

| Seçenek                  | Amaç                                                                                                                                                                                                                                  |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `theme`                  | Mermaid'in yerleşik temaları arasında geçiş yapar. VitePress `isDark` sinyali site temasıyla uyumu korur.                                                                                                                             |
| `startOnLoad`            | Renderer yaşam döngüsünü kullanırken `false` bırakın; render işlemi eklenti tarafından yönetilir.                                                                                                                                     |
| `flowchart` / `sequence` | Resmi Mermaid config şemasındaki seçenekleri tip güvenliğiyle yansıtır.                                                                                                                                                               |
| `gantt`                  | Proje zaman çizelgelerinde tarih biçimlendirme veya eksen görünürlüğünü özelleştirir.                                                                                                                                                 |
| `securityLevel`          | `mermaid.initialize()` içine geçirilen Mermaid güvenlik modudur. **Değişiklik:** varsayılan artık `'strict'`; diyagramlardaki inline HTML devre dışı bırakılır. Yalnızca tüm diyagram kaynaklarına güveniyorsanız `'loose'` kullanın. |
| `static`                 | `true` olduğunda araç çubuğu, yakınlaştırma, sürükleme, tam ekran, indirme ve klavye kontrolleri olmayan düz bir SVG oluşturur. Tema güncellemeleri SVG'yi yeniden render etmeye devam eder.                                          |

`createMermaidRenderer()` yeni bir Mermaid config ile tekrar çağrıldığında
mevcut singleton config'i **derin birleştirilir** (iç içe nesneler `flowchart`
gibi replaced yerine merge edilir) ve mount edilmiş diyagramlara runtime update
gönderilir.

## Otomatik sığdırma ve ortalama

Her etkileşimli diyagram, en-boy oranı korunarak `.diagram-wrapper` içine
sığacak en büyük ölçekte otomatik olarak render edilir ve her iki eksende
ortalanır.

Sığdırma, tema kaynaklı yeniden render işlemleri ve runtime güncellemeleri dahil
her Mermaid render işleminden sonra uygulanır. Tarayıcı veya çevre yerleşimi
konteyner boyutunu değiştirirse kullanıcı zoom ve kaydırma durumunu kaybetmeden
bir sonraki animasyon karesinde yeniden sığdırılır. `static: true` diyagramları
etkilemez. Araç çubuğundaki **Görünümü sıfırla** işlemi sığdırılmış ve
ortalanmış görünümü geri yükler.

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

Site açık ve koyu tema arasında geçiş yaptığında renderer'ı yeni Mermaid
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
          renderErrorText: 'Diyagram render edilemedi',
          toggleErrorDetailsText: 'Detayları göster',
          toggleErrorDetailsHideText: 'Detayları gizle',
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
          renderErrorText: '图表渲染失败',
          toggleErrorDetailsText: '显示详情',
          toggleErrorDetailsHideText: '隐藏详情',
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
- `showLanguageLabel`, VitePress'in orijinal `mermaid` kod bloğu etiketinin
  görünür kalıp kalmayacağını kontrol eder.
- `resetView`, `copyCode` ve erişilebilir düğme etiketleri klavye ve ekran
  okuyucu akışları için önemlidir.

## Güvenlik

Varsayılan olarak `securityLevel` `'strict'` olarak ayarlanır ve Mermaid
diyagramlarındaki **inline HTML devre dışı bırakılır**. Mermaid diyagramları
genellikle kullanıcı tarafından yazılmış Markdown dosyalarından geldiği için bu
en güvenli varsayıandır; inline HTML bu bağlamda XSS güvenlik açıklarına yol
açabilir.

İleri düzey Mermaid özellikleri için inline HTML gerekiyorsa (örneğin akış
diyagramı düğümlerinde tıklanabilir bağlantılar veya biçimli etiketler),
`'loose'` güvenlik seviyesini açıkça tercih edebilirsiniz — ancak **yalnızca**
tüm diyagram kaynaklarına güveniyorsanız:

```typescript
// ⚠️ Yalnızca sitedeki tüm Mermaid kod bloklarına güveniyorsanız kullanın.
const mermaidRenderer = createMermaidRenderer({
  securityLevel: 'loose',
});
```

SVG indirme işlemleri `securityLevel` ayarından bağımsız olarak sterilize
edilir: `<script>`, `<iframe>`, `<object>`, `<embed>`, stylesheet `<link>`
öğeleri ve tüm `on*` olay işleyici nitelikleri serileştirmeden önce kaldırılır.

## CSS özel nitelikleri (tasarım tokenları)

Renderer stil dosyasındaki tüm görsel sabitler `.mermaid-container` üzerinde CSS
özel nitelikleri olarak sunulur. Stil dosyasını düzenlemeden görünümü
özelleştirmek için bu nitelikleri override edin:

| Nitelik                             | Varsayılan                  | Amaç                            |
| :---------------------------------- | :-------------------------- | :------------------------------ |
| `--mermaid-control-bg`              | `var(--vp-c-bg)`            | Araç çubuğu ve düğme arka planı |
| `--mermaid-control-text`            | `var(--vp-c-text-1)`        | Araç çubuğu ikon ve metin rengi |
| `--mermaid-control-text-active`     | `var(--vp-c-brand)`         | Hover durumunda düğme rengi     |
| `--mermaid-control-border`          | `transparent`               | Düğme kenar rengi               |
| `--mermaid-control-shadow`          | `0 2px 4px rgba(0,0,0,0.1)` | Araç çubuğu gölgesi             |
| `--mermaid-control-radius`          | `0.375rem`                  | Araç çubuğu kenar yarıçapı      |
| `--mermaid-control-padding`         | `0.375rem`                  | Araç çubuğu iç boşluğu          |
| `--mermaid-control-gap`             | `0.375rem`                  | Araç çubuğu öğe aralığı         |
| `--mermaid-control-button-radius`   | `0.25rem`                   | Düğme kenar yarıçapı            |
| `--mermaid-control-button-padding`  | `0.375rem`                  | Düğme iç boşluğu                |
| `--mermaid-control-button-min-size` | `auto`                      | Düğmenin en küçük en ve boyu    |
| `--mermaid-control-icon-size`       | `18px`                      | Düğme ikonunun en ve boyu       |
| `--mermaid-spinner-duration`        | `0.8s`                      | Yükleme döngü süresi            |
| `--mermaid-notification-duration`   | `2s`                        | "Kopyalandı" bildirim süresi    |
| `--mermaid-error-bg`                | `var(--vp-c-bg-soft)`       | Hata konteyneri arka planı      |
| `--mermaid-error-border`            | `var(--vp-c-border)`        | Hata konteyneri kenarı          |
| `--mermaid-error-text`              | `var(--vp-c-danger)`        | Hata konteyneri metni           |

### Masaüstü ve mobil aynı tasarımı paylaşır

Masaüstü ve mobil araç çubukları aynı CSS kurallarından render edilir. Mobil
hiçbir şeyi yeniden stillendirmez; yalnızca kontrollerin rahat dokunulabilir
kalması için yukarıdaki dört tokenı büyütür:

| Nitelik                             | Masaüstü   | Mobil     |
| :---------------------------------- | :--------- | :-------- |
| `--mermaid-control-padding`         | `0.375rem` | `0.5rem`  |
| `--mermaid-control-gap`             | `0.375rem` | `0.5rem`  |
| `--mermaid-control-button-min-size` | `auto`     | `2.75rem` |
| `--mermaid-control-icon-size`       | `18px`     | `20px`    |

Bu nedenle `.mermaid-container` üzerinde bir tokenı override etmek iki araç
çubuğunu birden değiştirir. Yalnızca mobili ayarlamak isterseniz tokenı
`.mobile-controls` üzerinde override edin:

```css
.mobile-controls {
  --mermaid-control-button-min-size: 3rem;
}
```

Düğmeler varsayılan olarak kenarlıksızdır. İki modda da çerçeveli düğmeler
istiyorsanız `--mermaid-control-border` değerini görünür bir renge çekin:

```css
.mermaid-container {
  --mermaid-control-border: var(--vp-c-divider);
}
```

## Yapılandırılabilir yakınlaştırma sınırları

Yakınlaştırma sınırları `MermaidNavigationOptions` ile özelleştirilebilir:

```typescript
import { useMermaidNavigation } from 'vitepress-mermaid-renderer';

const { zoomIn, zoomOut, resetView } = useMermaidNavigation({
  minScale: 0.1, // varsayılan 0.2
  maxScale: 20, // varsayılan 10
  zoomStep: 1.5, // varsayılan 1.2
});
```

Bu, varsayılan yakınlaştırma aralığının dar veya geniş olduğu erişilebilirlik
veya diyagrama özel özelleştirme senaryolarında kullanışlıdır.

## Azaltılmış hareket

Renderer kullanıcının `prefers-reduced-motion` işletim sistemi ayarına saygı
duyar. Etkinleştirildiğinde `.mermaid-container` içindeki tüm animasyon ve
geçişler otomatik olarak devre dışı bırakılır — ek bir yapılandırma gerekmez.

Tek renderer instance'ı üzerinden yapılandırma yapmak, diyagramları sayfalar,
breakpoint'ler, temalar ve diller arasında tutarlı tutar. Tüm seçenekler için
[Yapılandırma Tipleri](./types.md) sayfasına bakın.
