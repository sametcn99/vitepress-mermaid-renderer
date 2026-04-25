# Yapılandırma Tipleri

Bu sayfa **VitePress Mermaid Renderer** içindeki araç çubuğu yapılandırma
seçeneklerini özetler.

## Üst seviye yapılandırma

Bu seçenekler `mermaidRenderer.setToolbar()` içine geçirilir.

| Seçenek             | Tip                       | Varsayılan  | Açıklama                                                              |
| :------------------ | :------------------------ | :---------- | :-------------------------------------------------------------------- |
| `showLanguageLabel` | `boolean`                 | `true`      | Orijinal VitePress `mermaid` etiketini gösterir veya gizler.          |
| `downloadFormat`    | `'svg' \| 'png' \| 'jpg'` | `'svg'`     | Diyagram indirme formatını belirler.                                  |
| `fullscreenMode`    | `'browser' \| 'dialog'`   | `'browser'` | Tam ekranın native API mi sayfa içi dialog mu kullanacağını belirler. |
| `desktop`           | `object`                  | `{}`        | Masaüstü araç çubuğu ayarları.                                        |
| `mobile`            | `object`                  | `{}`        | Mobil araç çubuğu ayarları.                                           |
| `fullscreen`        | `object`                  | `{}`        | Tam ekran modundaki araç çubuğu ayarları.                             |
| `i18n`              | `object`                  | İngilizce   | VitePress `localeIndex` anahtarına göre toolbar metni yerelleştirme.  |

## Toolbar yapılandırması

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

| Anahtar            | Varsayılan İngilizce |
| :----------------- | :------------------- |
| `zoomIn`           | `Zoom In`            |
| `zoomOut`          | `Zoom Out`           |
| `resetView`        | `Reset View`         |
| `copyCode`         | `Copy Code`          |
| `copyCodeCopied`   | `Copied`             |
| `download`         | `Download Diagram`   |
| `toggleFullscreen` | `Toggle Fullscreen`  |

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
