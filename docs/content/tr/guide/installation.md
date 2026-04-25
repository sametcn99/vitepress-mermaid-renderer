---
sidebarDepth: 2
---

# Kurulum ve Ayarlar

Bu bölüm `vitepress-mermaid-renderer` paketini kurar, `.vitepress` temasına
bağlar ve Mermaid diyagramlarının yerelleştirilmiş araç çubuğu kontrolleriyle
yüklendiğini doğrular.

## Paket yöneticisini seçin

Bu repoda Bun kullanın. Bun kullanmayan projeler için diğer paket yöneticileri
de gösterilmiştir.

::: code-group

```bash [bun]
bun add vitepress-mermaid-renderer
```

```bash [npm]
npm install vitepress-mermaid-renderer
```

```bash [yarn]
yarn add vitepress-mermaid-renderer
```

```bash [pnpm]
pnpm add vitepress-mermaid-renderer
```

:::

Mermaid ve Vue peer dependency olarak beklenir. Bu docs projesi Mermaid
`^11.14.0`, VitePress üzerinden Vue ve VitePress `^1.6.4` kullanır.

## Renderer'ı `.vitepress/theme` içine bağlayın

`.vitepress/theme/index.ts` dosyasını oluşturun veya düzenleyin. Aşağıdaki örnek
aktif VitePress locale değerini araç çubuğu i18n API’sine bağlar.

```typescript
import { h, nextTick, watch } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { createMermaidRenderer } from 'vitepress-mermaid-renderer';

const toolbarLocales = {
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
};

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark, localeIndex } = useData();

    const initMermaid = () => {
      const mermaidRenderer = createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'forest',
      });

      mermaidRenderer.setToolbar({
        showLanguageLabel: false,
        downloadFormat: 'svg',
        fullscreenMode: 'browser',
        desktop: {
          copyCode: 'enabled',
          toggleFullscreen: 'enabled',
          resetView: 'enabled',
          zoomOut: 'enabled',
          zoomIn: 'enabled',
          zoomLevel: 'enabled',
          download: 'enabled',
        },
        fullscreen: {
          copyCode: 'disabled',
          toggleFullscreen: 'enabled',
          resetView: 'disabled',
          zoomLevel: 'disabled',
          download: 'enabled',
        },
        i18n: {
          localeIndex: localeIndex.value,
          locales: toolbarLocales,
        },
      });
    };

    nextTick(() => initMermaid());

    watch(
      () => [isDark.value, localeIndex.value] as const,
      () => {
        initMermaid();
      },
    );

    return h(DefaultTheme.Layout);
  },
} satisfies Theme;
```

Renderer server-side rendering sırasında pasif kalır. VitePress tarayıcıda
hydrate olduktan sonra Mermaid bloklarına bağlanır ve aktif locale değiştiğinde
araç çubuğu güncellemeleri gönderir.

## Yerel önizlemeyi çalıştırın

```bash
bun run docs:dev
```

Önizleme sunucusunda `mermaid` olarak işaretlenen her kod bloğu yapılandırılmış
araç çubuğuyla render edilir. `/`, `/tr/` ve `/zh/` adreslerini ziyaret ederek
navigasyon, kenar çubuğu, arama etiketleri ve araç çubuğu metinlerinin aktif
dille eşleştiğini doğrulayın.

> `vitepress build` sırasında diyagramlar render edilmezse `.vitepress/cache` ve
> build çıktısını silip tekrar çalıştırın.
