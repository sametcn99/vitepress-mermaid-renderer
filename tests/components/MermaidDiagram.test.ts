import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MermaidDiagram from '../../src/MermaidDiagram.vue';
import { resolveToolbarConfig } from '../../src/toolbar';
import { _resetFullscreenManager } from '../../src/composables/useFullscreenManager';

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  run: vi.fn(),
  registerExternalDiagrams: vi.fn(),
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: mermaidMocks.initialize,
    run: mermaidMocks.run,
    registerExternalDiagrams: mermaidMocks.registerExternalDiagrams,
  },
}));

const flushDiagramRender = async () => {
  await nextTick();
  await vi.runAllTimersAsync();
  await nextTick();
};

describe('MermaidDiagram', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.className = '';
    _resetFullscreenManager();
    mermaidMocks.initialize.mockReset();
    mermaidMocks.run.mockReset();
    mermaidMocks.registerExternalDiagrams.mockReset();
    mermaidMocks.registerExternalDiagrams.mockResolvedValue(undefined);
    mermaidMocks.run.mockImplementation(
      async ({ nodes }: { nodes: Element[] }) => {
        const [element] = nodes;
        element.innerHTML = '<svg viewBox="0 0 120 60"></svg>';
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.className = '';
  });

  it('renders a diagram, emits renderComplete, and reacts to toolbar updates', async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig({ fullscreenMode: 'browser' }),
      },
    });

    await flushDiagramRender();

    expect(mermaidMocks.initialize).toHaveBeenCalled();
    expect(mermaidMocks.run).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.diagram-wrapper .mermaid > svg').exists()).toBe(true);
    expect(wrapper.emitted('renderComplete')?.[0]?.[0]).toMatchObject({
      success: true,
    });

    document.dispatchEvent(
      new CustomEvent('vitepress-mermaid:toolbar-updated', {
        detail: { fullscreenMode: 'dialog' },
      }),
    );
    await nextTick();

    await wrapper
      .get('.desktop-controls [data-mermaid-control="toggleFullscreen"]')
      .trigger('click');
    await nextTick();

    expect(wrapper.find('.mermaid-dialog-backdrop').exists()).toBe(true);
    expect(document.body.classList.contains('mermaid-dialog-open')).toBe(true);

    await wrapper.get('.mermaid-dialog-backdrop').trigger('click');
    await nextTick();

    expect(wrapper.find('.mermaid-dialog-backdrop').exists()).toBe(false);

    wrapper.unmount();
    expect(document.body.classList.contains('mermaid-dialog-open')).toBe(false);
  });

  it('renders a plain SVG without controls or interactive navigation in static mode', async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        static: true,
      },
    });
    await flushDiagramRender();

    expect(wrapper.find('.static-mermaid-container').exists()).toBe(true);
    expect(wrapper.find('.mermaid > svg').exists()).toBe(true);
    expect(wrapper.find('.controls').exists()).toBe(false);
    expect(wrapper.find('.diagram-error').exists()).toBe(false);
    expect(
      wrapper.get('.diagram-wrapper').attributes('tabindex'),
    ).toBeUndefined();
    expect(wrapper.get('.diagram-wrapper').attributes('role')).toBeUndefined();

    await wrapper.get('.diagram-wrapper').trigger('wheel', { ctrlKey: true });
    expect(wrapper.find('.mermaid').attributes('style')).not.toContain('scale');

    document.dispatchEvent(
      new CustomEvent('vitepress-mermaid:config-updated', {
        detail: { theme: 'dark' },
      }),
    );
    await flushDiagramRender();

    const initializeCalls = mermaidMocks.initialize.mock.calls;
    expect(initializeCalls[initializeCalls.length - 1]?.[0]).toMatchObject({
      theme: 'dark',
    });
    expect(wrapper.find('.mermaid > svg').exists()).toBe(true);
    wrapper.unmount();
  });

  it('keeps the zoom transform outside the Mermaid render target during theme updates', async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
      },
    });

    await flushDiagramRender();
    await wrapper.get('[data-mermaid-control="zoomIn"]').trigger('click');
    const viewport = wrapper.get('.mermaid-viewport');

    expect(viewport.attributes('style')).toContain('scale(1.2)');
    expect(viewport.classes()).toContain('mermaid-zooming');
    await vi.advanceTimersByTimeAsync(300);
    expect(viewport.classes()).not.toContain('mermaid-zooming');

    document.dispatchEvent(
      new CustomEvent('vitepress-mermaid:config-updated', {
        detail: { theme: 'dark' },
      }),
    );
    await flushDiagramRender();

    expect(viewport.attributes('style')).toContain('scale(1.2)');
    expect(wrapper.find('.mermaid > svg').exists()).toBe(true);
    wrapper.unmount();
  });

  it('anchors fullscreen wheel zoom to the cursor position', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains('diagram-wrapper')) {
          return new DOMRect(0, 0, 400, 200);
        }
        return new DOMRect(20, 30, 100, 40);
      },
    );

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig({ fullscreenMode: 'dialog' }),
      },
    });
    await flushDiagramRender();

    await wrapper
      .get('[data-mermaid-control="toggleFullscreen"]')
      .trigger('click');
    await wrapper.get('.diagram-wrapper').trigger('wheel', {
      deltaY: -120,
      clientX: 50,
      clientY: 30,
    });
    await vi.runAllTimersAsync();

    const transform =
      wrapper.get('.mermaid-viewport').attributes('style') ?? '';
    expect(transform).toContain('scale(1.1)');
    const translate = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
    expect(translate).not.toBeNull();
    expect(Number(translate?.[1])).toBeCloseTo(13.63636363636364);
    expect(Number(translate?.[2])).toBeCloseTo(6.363636363636366);
    wrapper.unmount();
  });

  it('anchors fullscreen toolbar zoom to the SVG center', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains('diagram-wrapper')) {
          return new DOMRect(0, 0, 400, 200);
        }
        return new DOMRect(20, 30, 100, 40);
      },
    );
    vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(20, 30, 100, 40),
    );

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig({
          fullscreenMode: 'dialog',
          fullscreen: { zoomIn: 'enabled', zoomOut: 'enabled' },
        }),
      },
    });
    await flushDiagramRender();

    await wrapper
      .get('[data-mermaid-control="toggleFullscreen"]')
      .trigger('click');
    await wrapper.get('[data-mermaid-control="zoomIn"]').trigger('click');

    const transform =
      wrapper.get('.mermaid-viewport').attributes('style') ?? '';
    expect(transform).toContain('scale(1.2)');
    const translate = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
    expect(translate).not.toBeNull();
    expect(Number(translate?.[1])).toBeCloseTo(21.666666666666668);
    expect(Number(translate?.[2])).toBeCloseTo(8.333333333333334);
    wrapper.unmount();
  });

  it('preserves the fitted zoom level when the theme rerenders the diagram', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains('diagram-wrapper')) {
          return new DOMRect(0, 0, 400, 200);
        }
        if (this.classList.contains('mermaid')) {
          return new DOMRect(0, 0, 600, 100);
        }
        return new DOMRect();
      },
    );

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        fitToContainer: true,
      },
    });

    await flushDiagramRender();
    const viewport = wrapper.get('.mermaid-viewport');
    await wrapper.get('[data-mermaid-control="zoomOut"]').trigger('click');
    const zoomedTransform = viewport.attributes('style');
    let transformDuringThemeRender = '';
    mermaidMocks.run.mockImplementation(
      async ({ nodes }: { nodes: Element[] }) => {
        const [element] = nodes;
        transformDuringThemeRender = (element.parentElement as HTMLElement)
          .style.transform;
        element.innerHTML = '<svg viewBox="0 0 120 60"></svg>';
      },
    );

    document.dispatchEvent(
      new CustomEvent('vitepress-mermaid:config-updated', {
        detail: { theme: 'dark' },
      }),
    );
    await flushDiagramRender();

    expect(transformDuringThemeRender).toBe('scale(1) translate(0px, 0px)');
    expect(viewport.attributes('style')).toBe(zoomedTransform);
    expect(wrapper.find('.mermaid > svg').exists()).toBe(true);
    wrapper.unmount();
  });

  it('fits and centers the diagram when fitToContainer is enabled', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains('diagram-wrapper')) {
          return new DOMRect(0, 0, 400, 200);
        }
        if (this.classList.contains('mermaid')) {
          return new DOMRect(0, 0, 600, 100);
        }
        return new DOMRect();
      },
    );

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        fitToContainer: true,
      },
    });
    await flushDiagramRender();
    await vi.runAllTimersAsync();

    const diagram = wrapper.get('.mermaid-viewport').element as HTMLElement;
    const transform = diagram.style.transform;
    expect(transform).toContain('scale(0.6666666666666666)');
    expect(transform).toContain('translate(-100px, 50px)');
    expect(wrapper.get('.zoom-level').text()).toBe('100%');

    await wrapper.get('[data-mermaid-control="zoomIn"]').trigger('click');
    expect(diagram.style.transform).toContain('scale(0.7999999999999999)');
    expect(wrapper.get('.zoom-level').text()).toBe('120%');

    await wrapper.get('[data-mermaid-control="resetView"]').trigger('click');
    await vi.runAllTimersAsync();
    await nextTick();

    expect(diagram.style.transform).toContain('scale(0.6666666666666666)');
    expect(diagram.style.transform).toContain('translate(-100px, 50px)');
    wrapper.unmount();
  });

  it('surfaces render failures through the error component and event payload', async () => {
    vi.useRealTimers();
    mermaidMocks.run.mockRejectedValueOnce(new Error('render failed'));

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig(),
      },
    });

    await nextTick();
    await Promise.resolve();
    await nextTick();
    await Promise.resolve();
    await nextTick();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await nextTick();

    expect(wrapper.find('.diagram-error').exists()).toBe(true);
    expect(wrapper.text()).toContain('Failed to render diagram');
    expect(wrapper.emitted('renderComplete')?.[0]?.[0]).toMatchObject({
      success: false,
    });
  });

  it('accepts raw MermaidToolbarOptions and resolves them internally', async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: { downloadFormat: 'png', desktop: { download: 'enabled' } },
      },
    });
    await flushDiagramRender();

    expect(
      wrapper
        .find('.desktop-controls [data-mermaid-control="download"]')
        .exists(),
    ).toBe(true);
    wrapper.unmount();
  });

  it('updates tooltip text when receiving a localized toolbar-updated event', async () => {
    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig(),
      },
    });
    await flushDiagramRender();

    const initial = wrapper
      .get('.desktop-controls [data-mermaid-control="copyCode"]')
      .attributes('title');
    expect(initial).toBe('Copy Code');

    document.dispatchEvent(
      new CustomEvent('vitepress-mermaid:toolbar-updated', {
        detail: resolveToolbarConfig({
          i18n: {
            localeIndex: 'tr',
            locales: { tr: { tooltips: { copyCode: 'Kodu kopyala' } } },
          },
        }),
      }),
    );
    await nextTick();

    const updated = wrapper
      .get('.desktop-controls [data-mermaid-control="copyCode"]')
      .attributes('title');
    expect(updated).toBe('Kodu kopyala');
    wrapper.unmount();
  });

  it('downloads SVG via Blob + anchor click', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:svg');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: clickSpy });
      }
      return el;
    });

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig({
          downloadFormat: 'svg',
          desktop: { download: 'enabled' },
        }),
      },
    });
    await flushDiagramRender();

    await wrapper
      .get('.desktop-controls [data-mermaid-control="download"]')
      .trigger('click');
    await nextTick();

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('logs an error and aborts download when no SVG is present', async () => {
    mermaidMocks.run.mockImplementation(async () => {
      // intentionally produce no SVG
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig({
          downloadFormat: 'svg',
          desktop: { download: 'enabled' },
        }),
      },
    });
    await flushDiagramRender();

    await wrapper
      .get('.desktop-controls [data-mermaid-control="download"]')
      .trigger('click');
    await nextTick();

    expect(errorSpy).toHaveBeenCalledWith('SVG element not found for download');
    wrapper.unmount();
  });

  it('registers and removes vendor-prefixed fullscreenchange listeners', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const wrapper = mount(MermaidDiagram, {
      attachTo: document.body,
      props: {
        code: 'flowchart LR\nA-->B',
        toolbar: resolveToolbarConfig(),
      },
    });
    await flushDiagramRender();

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];
    for (const ev of events) {
      expect(addSpy.mock.calls.some((c) => c[0] === ev)).toBe(true);
    }

    wrapper.unmount();

    for (const ev of events) {
      expect(removeSpy.mock.calls.some((c) => c[0] === ev)).toBe(true);
    }
  });
});
