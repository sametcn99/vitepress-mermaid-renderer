# Yapılandırma Tipleri

Bu sayfa **VitePress Mermaid Renderer** içindeki araç çubuğu yapılandırma
seçeneklerini özetler.

## Renderer yapılandırması

`createMermaidRenderer()` Mermaid yapılandırma seçeneklerini doğrudan alır.
Renderer'a özel aşağıdaki seçenekleri de destekler.

| Seçenek          | Tip       | Varsayılan | Açıklama                                                                                     |
| :--------------- | :-------- | :--------- | :------------------------------------------------------------------------------------------- |
| `static`         | `boolean` | `false`    | Kontrol ve etkileşimli gezinme olmadan tema uyumlu SVG üretir.                               |
| `fitToContainer` | `boolean` | `true`     | Her Mermaid render işleminden sonra etkileşimli diyagramı kapsayıcısına sığdırır ve ortalar. |

`theme`, `flowchart` ve `securityLevel` gibi diğer seçenekler
[Mermaid yapılandırma şemasını](https://mermaid.js.org/config/configuration.html)
izler.

## Araç çubuğu yapılandırması

Bu seçenekler `mermaidRenderer.setToolbar()` içine geçirilir.

`desktop`, `mobile` ve `fullscreen` nesneleri aynı yapıyı paylaşır.

| Anahtar        | Tip                       | Açıklama                                     |
| :------------- | :------------------------ | :------------------------------------------- |
| `[buttonName]` | `'enabled' \| 'disabled'` | Belirli düğmeleri etkinleştirir veya gizler. |
| `zoomLevel`    | `'enabled' \| 'disabled'` | Zoom yüzdesi göstergesini kontrol eder.      |
| `positions`    | `object`                  | Araç çubuğunun konumunu belirler.            |

### Varsayılan düğme durumları

| Düğme              | Desktop    | Mobile     | Fullscreen | Açıklama                               |
| :----------------- | :--------- | :--------- | :--------- | :------------------------------------- |
| `zoomIn`           | `enabled`  | `disabled` | `disabled` | Diyagramı yakınlaştırır.               |
| `zoomOut`          | `enabled`  | `disabled` | `disabled` | Diyagramı uzaklaştırır.                |
| `resetView`        | `enabled`  | `enabled`  | `disabled` | Görünümü ilk haline döndürür.          |
| `copyCode`         | `enabled`  | `enabled`  | `disabled` | Mermaid kaynak kodunu panoya kopyalar. |
| `download`         | `disabled` | `disabled` | `disabled` | Diyagramı seçili formatta indirir.     |
| `toggleFullscreen` | `enabled`  | `enabled`  | `enabled`  | Tam ekran modunu açıp kapatır.         |

### Konum yapılandırması

| Anahtar      | Değerler            | Varsayılan | Açıklama     |
| :----------- | :------------------ | :--------- | :----------- |
| `vertical`   | `'top' \| 'bottom'` | `bottom`   | Dikey konum. |
| `horizontal` | `'left' \| 'right'` | `right`    | Yatay konum. |

## Toolbar metin yerelleştirme (`i18n`)

| Anahtar       | Tip                                                   | Açıklama                                                    |
| :------------ | :---------------------------------------------------- | :---------------------------------------------------------- |
| `localeIndex` | `string`                                              | Aktif VitePress locale anahtarı.                            |
| `tooltips`    | `Partial<ToolbarText>`                                | Locale özel değer yoksa kullanılan global override tablosu. |
| `locales`     | `Record<string, { tooltips?: Partial<ToolbarText> }>` | `localeIndex` ile eşleşen locale özel metin tabloları.      |

### `ToolbarText`

| Anahtar                      | Varsayılan İngilizce       |
| :--------------------------- | :------------------------- |
| `zoomIn`                     | `Zoom In`                  |
| `zoomOut`                    | `Zoom Out`                 |
| `resetView`                  | `Reset View`               |
| `copyCode`                   | `Copy Code`                |
| `copyCodeCopied`             | `Copied`                   |
| `download`                   | `Download Diagram`         |
| `toggleFullscreen`           | `Toggle Fullscreen`        |
| `renderErrorText`            | `Failed to render diagram` |
| `toggleErrorDetailsText`     | `Show Details`             |
| `toggleErrorDetailsHideText` | `Hide Details`             |

Çözüm sırası: `locales[localeIndex].tooltips[key]` → `tooltips[key]` → yerleşik
varsayılan. Boş string değerleri her katmanda yok sayılır.

## Örnek kullanım

```typescript
const mermaidRenderer = createMermaidRenderer({
  theme: 'forest',
});

mermaidRenderer.setToolbar({
  downloadFormat: 'png',
  desktop: {
    download: 'enabled',
    positions: { vertical: 'top', horizontal: 'right' },
  },
});
```

Uygulama detayları için [Yapılandırma](./configuration.md) ve
[Araç Çubuğu Özelleştirme](./toolbar.md) sayfalarına bakın.
