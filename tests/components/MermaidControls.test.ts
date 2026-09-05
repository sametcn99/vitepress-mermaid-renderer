import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MermaidControls from '../../src/components/MermaidControls.vue';
import { resolveToolbarConfig } from '../../src/toolbar';

describe('MermaidControls', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('switches to fullscreen toolbar settings when fullscreen mode is enabled', async () => {
    const toolbar = resolveToolbarConfig({
      desktop: {
        positions: { vertical: 'bottom', horizontal: 'right' },
      },
      fullscreen: {
        download: 'enabled',
        positions: { vertical: 'top', horizontal: 'left' },
      },
    });

    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar,
      },
    });

    expect(
      wrapper
        .find('.desktop-controls [data-mermaid-control="download"]')
        .exists(),
    ).toBe(false);
    expect(wrapper.get('.desktop-controls').classes()).toContain(
      'toolbar-vertical-bottom',
    );
    expect(wrapper.get('.desktop-controls').classes()).toContain(
      'toolbar-horizontal-right',
    );

    await wrapper.setProps({ isFullscreen: true });

    expect(
      wrapper
        .find('.desktop-controls [data-mermaid-control="download"]')
        .exists(),
    ).toBe(true);
    expect(wrapper.get('.desktop-controls').classes()).toContain(
      'toolbar-vertical-top',
    );
    expect(wrapper.get('.desktop-controls').classes()).toContain(
      'toolbar-horizontal-left',
    );
  });

  it('copies the Mermaid source and clears the copied state after the timeout', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig(),
      },
    });

    await wrapper
      .get('.desktop-controls [data-mermaid-control="copyCode"]')
      .trigger('click');
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledWith('graph TD; A-->B');
    expect(wrapper.text()).toContain('Copied');

    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.text()).not.toContain('Copied');
  });

  it('renders localized copied notification text', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          i18n: {
            localeIndex: 'tr',
            locales: {
              tr: {
                tooltips: {
                  copyCode: 'Kodu kopyala',
                  copyCodeCopied: 'Kopyalandı',
                },
              },
            },
          },
        }),
      },
    });

    await wrapper
      .get('.desktop-controls [data-mermaid-control="copyCode"]')
      .trigger('click');
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('graph TD; A-->B');
    expect(wrapper.text()).toContain('Kopyalandı');
    expect(wrapper.text()).not.toContain('Copied');
  });

  it('emits the resolved download format when download is clicked', async () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          downloadFormat: 'jpg',
          desktop: { download: 'enabled' },
        }),
      },
    });

    await wrapper
      .get('.desktop-controls [data-mermaid-control="download"]')
      .trigger('click');

    expect(wrapper.emitted('download')).toEqual([['jpg']]);
  });

  it('renders localized tooltip text on title and aria-label and exposes data-mermaid-control attributes', () => {
    const toolbar = resolveToolbarConfig({
      desktop: { download: 'enabled' },
      mobile: { zoomIn: 'enabled' },
      i18n: {
        localeIndex: 'tr',
        locales: {
          tr: {
            tooltips: {
              zoomIn: 'Yakınlaştır',
              copyCode: 'Kodu kopyala',
              copyCodeCopied: 'Kopyalandı',
              download: 'Diyagramı indir',
              resetView: 'Görünümü sıfırla',
              toggleFullscreen: 'Tam ekran',
              zoomOut: 'Uzaklaştır',
            },
          },
        },
      },
    });

    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar,
      },
    });

    const copyBtn = wrapper.get(
      '.desktop-controls [data-mermaid-control="copyCode"]',
    );
    expect(copyBtn.attributes('title')).toBe('Kodu kopyala');
    expect(copyBtn.attributes('aria-label')).toBe('Kodu kopyala');

    const dlBtn = wrapper.get(
      '.desktop-controls [data-mermaid-control="download"]',
    );
    expect(dlBtn.attributes('title')).toBe('Diyagramı indir');

    const mobileZoomIn = wrapper.get(
      '.mobile-controls [data-mermaid-control="zoomIn"]',
    );
    expect(mobileZoomIn.attributes('title')).toBe('Yakınlaştır');
    expect(mobileZoomIn.attributes('aria-label')).toBe('Yakınlaştır');
  });

  it('hides the zoom-level indicator when desktop.zoomLevel is disabled', () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1.25,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({ desktop: { zoomLevel: 'disabled' } }),
      },
    });
    expect(wrapper.find('.desktop-controls .zoom-level').exists()).toBe(false);
  });

  it('renders mobile controls separately from desktop', () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          mobile: { zoomIn: 'enabled', zoomOut: 'enabled' },
        }),
      },
    });
    expect(wrapper.find('.mobile-controls').exists()).toBe(true);
  });

  it('keeps toolbar collapsing opt-in and toggles the desktop controls accessibly', async () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          desktop: { toggleToolbar: 'enabled' },
        }),
      },
    });

    expect(
      wrapper
        .find('.desktop-controls [data-mermaid-control="toggleToolbar"]')
        .exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('.mobile-controls [data-mermaid-control="toggleToolbar"]')
        .exists(),
    ).toBe(false);

    const toggle = wrapper.get(
      '.desktop-controls [data-mermaid-control="toggleToolbar"]',
    );
    const items = wrapper.get('.desktop-controls .toolbar-items');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(toggle.attributes('aria-controls')).toBe(items.attributes('id'));
    expect(items.attributes('style') ?? '').not.toContain('display: none');

    await toggle.trigger('click');

    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(toggle.attributes('title')).toBe('Expand Toolbar');
    expect(items.attributes('style')).toContain('display: none');

    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(toggle.attributes('title')).toBe('Collapse Toolbar');
    expect(items.attributes('style') ?? '').not.toContain('display: none');
  });

  it('uses localized labels for the collapse toggle action', async () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          desktop: { toggleToolbar: 'enabled' },
          i18n: {
            tooltips: {
              toggleToolbarExpand: 'Aç',
              toggleToolbarCollapse: 'Kapat',
            },
          },
        }),
      },
    });

    const toggle = wrapper.get(
      '.desktop-controls [data-mermaid-control="toggleToolbar"]',
    );
    expect(toggle.attributes('title')).toBe('Kapat');

    await toggle.trigger('click');
    expect(toggle.attributes('title')).toBe('Aç');
  });

  it('starts collapsed only when configured and restores the controls on expand', async () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          desktop: { toggleToolbar: 'enabled', collapsed: 'collapsed' },
        }),
      },
    });

    const toggle = wrapper.get(
      '.desktop-controls [data-mermaid-control="toggleToolbar"]',
    );
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(
      wrapper.get('.desktop-controls .toolbar-items').attributes('style'),
    ).toContain('display: none');
    expect(
      wrapper
        .find('.desktop-controls [data-mermaid-control="zoomIn"]')
        .exists(),
    ).toBe(true);

    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(
      wrapper.get('.desktop-controls .toolbar-items').attributes('style') ?? '',
    ).not.toContain('display: none');
  });

  it('keeps collapse state local to each diagram instance', async () => {
    const toolbar = resolveToolbarConfig({
      desktop: { toggleToolbar: 'enabled' },
    });
    const first = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar,
      },
    });
    const second = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; C-->D',
        isFullscreen: false,
        toolbar,
      },
    });

    await first
      .get('.desktop-controls [data-mermaid-control="toggleToolbar"]')
      .trigger('click');

    expect(
      first
        .get('.desktop-controls [data-mermaid-control="toggleToolbar"]')
        .attributes('aria-expanded'),
    ).toBe('false');
    expect(
      second
        .get('.desktop-controls [data-mermaid-control="toggleToolbar"]')
        .attributes('aria-expanded'),
    ).toBe('true');

    first.unmount();
    second.unmount();
  });

  it('preserves each mode collapse state across fullscreen changes', async () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          desktop: { toggleToolbar: 'enabled' },
          fullscreen: { toggleToolbar: 'enabled' },
        }),
      },
    });

    await wrapper
      .get('.desktop-controls [data-mermaid-control="toggleToolbar"]')
      .trigger('click');
    expect(
      wrapper
        .get('.desktop-controls [data-mermaid-control="toggleToolbar"]')
        .attributes('aria-expanded'),
    ).toBe('false');

    await wrapper.setProps({ isFullscreen: true });
    expect(
      wrapper
        .get('.desktop-controls [data-mermaid-control="toggleToolbar"]')
        .attributes('aria-expanded'),
    ).toBe('true');

    await wrapper.setProps({ isFullscreen: false });
    expect(
      wrapper
        .get('.desktop-controls [data-mermaid-control="toggleToolbar"]')
        .attributes('aria-expanded'),
    ).toBe('false');
  });

  it('does not render a toolbar container when toggleToolbar is the only enabled control', () => {
    const allDisabled = {
      zoomIn: 'disabled' as const,
      zoomOut: 'disabled' as const,
      resetView: 'disabled' as const,
      copyCode: 'disabled' as const,
      download: 'disabled' as const,
      toggleFullscreen: 'disabled' as const,
      toggleToolbar: 'enabled' as const,
      zoomLevel: 'disabled' as const,
    };
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig({
          desktop: allDisabled,
          mobile: allDisabled,
        }),
      },
    });

    expect(wrapper.find('.desktop-controls').exists()).toBe(false);
    expect(wrapper.find('.mobile-controls').exists()).toBe(false);
  });

  it('does not render toggle buttons with the default toolbar configuration', () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig(),
      },
    });

    expect(
      wrapper.find('[data-mermaid-control="toggleToolbar"]').exists(),
    ).toBe(false);
  });

  it('exposes refs for fullscreen control elements', () => {
    const wrapper = mount(MermaidControls, {
      props: {
        scale: 1,
        code: 'graph TD; A-->B',
        isFullscreen: false,
        toolbar: resolveToolbarConfig(),
      },
    });
    const exposed = wrapper.vm as unknown as {
      $refs: { controls?: HTMLElement; mobileControls?: HTMLElement };
    };
    expect(exposed.$refs.controls).toBeInstanceOf(HTMLElement);
  });
});
