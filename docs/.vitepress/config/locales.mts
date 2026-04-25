import type { DefaultTheme } from 'vitepress';

export const siteTitle = 'VitePress Mermaid Renderer';

export const siteUrl = 'https://vitepress-mermaid-renderer.vercel.app';

export const siteDescriptions = {
  root: 'A VitePress plugin to render Mermaid diagrams with interactive controls.',
  tr: 'Mermaid diyagramlarını etkileşimli kontrollerle render eden VitePress eklentisi.',
  zh: '用于通过交互式控件渲染 Mermaid 图表的 VitePress 插件。',
} as const;

type LocaleKey = keyof typeof siteDescriptions;

const localePrefixes: Record<LocaleKey, string> = {
  root: '',
  tr: '/tr',
  zh: '/zh',
};

const labels = {
  root: {
    localeLabel: 'English',
    lang: 'en-US',
    home: 'Home',
    guide: 'Guide',
    resources: 'Resources',
    overview: 'Overview',
    installation: 'Installation & Setup',
    configuration: 'Configuration',
    toolbar: 'Toolbar Customization',
    types: 'Configuration Types',
    troubleshooting: 'Troubleshooting',
    examples: 'Examples',
    basicExamples: 'Basic Examples',
    advancedExamples: 'Advanced Examples',
    development: 'Development',
    testing: 'Testing Guide',
    mermaidDocs: 'Mermaid Documentation',
    vitepressGuide: 'VitePress Guide',
    npmPackage: 'npm Package',
    searchButton: 'Search docs',
    searchAria: 'Search documentation',
    footerMessage: 'Released under the GPL-3.0 License.',
    copyright: 'Copyright ©',
    editText: 'Edit this page on GitHub',
    prev: 'Previous page',
    next: 'Next page',
    lastUpdated: 'Last updated',
  },
  tr: {
    localeLabel: 'Türkçe',
    lang: 'tr-TR',
    home: 'Ana Sayfa',
    guide: 'Rehber',
    resources: 'Kaynaklar',
    overview: 'Genel Bakış',
    installation: 'Kurulum ve Ayarlar',
    configuration: 'Yapılandırma',
    toolbar: 'Araç Çubuğu Özelleştirme',
    types: 'Yapılandırma Tipleri',
    troubleshooting: 'Sorun Giderme',
    examples: 'Örnekler',
    basicExamples: 'Temel Örnekler',
    advancedExamples: 'Gelişmiş Örnekler',
    development: 'Geliştirme',
    testing: 'Test Rehberi',
    mermaidDocs: 'Mermaid Dokümantasyonu',
    vitepressGuide: 'VitePress Rehberi',
    npmPackage: 'npm Paketi',
    searchButton: 'Dokümanlarda ara',
    searchAria: 'Dokümantasyonda ara',
    footerMessage: 'GPL-3.0 lisansı altında yayınlanmıştır.',
    copyright: 'Telif Hakkı ©',
    editText: 'Bu sayfayı GitHub üzerinde düzenle',
    prev: 'Önceki sayfa',
    next: 'Sonraki sayfa',
    lastUpdated: 'Son güncelleme',
  },
  zh: {
    localeLabel: '简体中文',
    lang: 'zh-CN',
    home: '首页',
    guide: '指南',
    resources: '资源',
    overview: '概览',
    installation: '安装与设置',
    configuration: '配置',
    toolbar: '工具栏自定义',
    types: '配置类型',
    troubleshooting: '故障排除',
    examples: '示例',
    basicExamples: '基础示例',
    advancedExamples: '高级示例',
    development: '开发',
    testing: '测试指南',
    mermaidDocs: 'Mermaid 文档',
    vitepressGuide: 'VitePress 指南',
    npmPackage: 'npm 包',
    searchButton: '搜索文档',
    searchAria: '搜索文档',
    footerMessage: '基于 GPL-3.0 许可证发布。',
    copyright: '版权所有 ©',
    editText: '在 GitHub 上编辑此页面',
    prev: '上一页',
    next: '下一页',
    lastUpdated: '最后更新',
  },
} as const;

/**
 * Adds the locale path prefix to an internal VitePress route.
 *
 * @param locale - VitePress locale key.
 * @param path - Root-relative route without a locale prefix.
 * @returns A locale-aware route for navigation and sidebar links.
 */
const withLocale = (locale: LocaleKey, path: `/${string}`): string => {
  const prefix = localePrefixes[locale];
  if (path === '/') {
    return prefix ? `${prefix}/` : '/';
  }
  return `${prefix}${path}`;
};

/**
 * Creates a localized sidebar tree while keeping the route structure aligned.
 *
 * @param locale - VitePress locale key.
 * @returns Localized VitePress sidebar groups.
 */
const createSidebar = (locale: LocaleKey): DefaultTheme.Sidebar => {
  const text = labels[locale];

  return [
    {
      text: text.guide,
      items: [
        {
          text: text.overview,
          link: withLocale(locale, '/guide/getting-started'),
        },
        {
          text: text.installation,
          link: withLocale(locale, '/guide/installation'),
        },
        {
          text: text.configuration,
          link: withLocale(locale, '/guide/configuration'),
        },
        { text: text.toolbar, link: withLocale(locale, '/guide/toolbar') },
        { text: text.types, link: withLocale(locale, '/guide/types') },
        {
          text: text.troubleshooting,
          link: withLocale(locale, '/guide/troubleshooting'),
        },
      ],
    },
    {
      text: text.examples,
      items: [
        {
          text: text.basicExamples,
          link: withLocale(locale, '/examples/basic'),
        },
        {
          text: text.advancedExamples,
          link: withLocale(locale, '/examples/advanced'),
        },
      ],
    },
    {
      text: text.development,
      items: [{ text: text.testing, link: withLocale(locale, '/testing') }],
    },
  ];
};

/**
 * Creates a complete localized VitePress theme configuration.
 *
 * @param locale - VitePress locale key.
 * @returns Theme options for one locale.
 */
const createThemeConfig = (locale: LocaleKey): DefaultTheme.Config => {
  const text = labels[locale];

  return {
    siteTitle: siteTitle,
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: {
            buttonText: text.searchButton,
            buttonAriaLabel: text.searchAria,
          },
        },
      },
    },
    nav: [
      { text: text.home, link: withLocale(locale, '/') },
      {
        text: text.guide,
        items: [
          {
            text: text.overview,
            link: withLocale(locale, '/guide/getting-started'),
          },
          {
            text: text.installation,
            link: withLocale(locale, '/guide/installation'),
          },
          {
            text: text.configuration,
            link: withLocale(locale, '/guide/configuration'),
          },
          { text: text.toolbar, link: withLocale(locale, '/guide/toolbar') },
          { text: text.types, link: withLocale(locale, '/guide/types') },
          {
            text: text.troubleshooting,
            link: withLocale(locale, '/guide/troubleshooting'),
          },
        ],
      },
      { text: text.examples, link: withLocale(locale, '/examples/basic') },
      {
        text: text.resources,
        items: [
          { text: text.testing, link: withLocale(locale, '/testing') },
          { text: text.mermaidDocs, link: 'https://mermaid.js.org/intro/' },
          {
            text: text.vitepressGuide,
            link: 'https://vitepress.dev/guide/what-is-vitepress',
          },
          {
            text: text.npmPackage,
            link: 'https://www.npmjs.com/package/vitepress-mermaid-renderer',
          },
        ],
      },
    ],
    sidebar: createSidebar(locale),
    footer: {
      message: text.footerMessage,
      copyright: `${text.copyright} ${new Date().getFullYear()}`,
    },
    editLink: {
      pattern:
        'https://github.com/sametcn99/vitepress-mermaid-renderer/edit/main/docs/content/:path',
      text: text.editText,
    },
    docFooter: {
      prev: text.prev,
      next: text.next,
    },
    lastUpdatedText: text.lastUpdated,
  };
};

export const locales = {
  root: {
    label: labels.root.localeLabel,
    lang: labels.root.lang,
    title: siteTitle,
    description: siteDescriptions.root,
    themeConfig: createThemeConfig('root'),
  },
  tr: {
    label: labels.tr.localeLabel,
    lang: labels.tr.lang,
    link: '/tr/',
    title: siteTitle,
    description: siteDescriptions.tr,
    themeConfig: createThemeConfig('tr'),
  },
  zh: {
    label: labels.zh.localeLabel,
    lang: labels.zh.lang,
    link: '/zh/',
    title: siteTitle,
    description: siteDescriptions.zh,
    themeConfig: createThemeConfig('zh'),
  },
};

export const commonThemeConfig: DefaultTheme.Config = {
  socialLinks: [
    {
      icon: 'github',
      link: 'https://github.com/sametcn99/vitepress-mermaid-renderer',
    },
    {
      icon: 'npm',
      link: 'https://www.npmjs.com/package/vitepress-mermaid-renderer',
    },
  ],
  externalLinkIcon: true,
};
