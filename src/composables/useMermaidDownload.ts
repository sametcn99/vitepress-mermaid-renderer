/**
 * @module useMermaidDownload
 *
 * Vue 3 composable that handles downloading a rendered Mermaid diagram
 * as SVG, PNG, or JPEG.
 *
 * Extracted from `MermaidDiagram.vue` to reduce component complexity
 * and improve testability.
 *
 * @example
 * ```ts
 * const { handleDownload } = useMermaidDownload(diagramId);
 * handleDownload('svg');
 * ```
 */
import { type DownloadFormat } from '../toolbar';

/**
 * Sanitises a string for safe display by removing control characters
 * and limiting length. Used to prevent potential XSS vectors in
 * error messages and diagram IDs.
 *
 * @param str - The string to sanitise.
 * @param maxLength - Maximum allowed length (default 200).
 * @returns The sanitised string.
 */
const sanitise = (str: string, maxLength = 200): string =>
  str.replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLength);

/**
 * Strips potentially dangerous elements and event-handler attributes from
 * a cloned SVG before it is serialised for download. This prevents scripts,
 * iframes, and other embedded content from being saved to the user's disk
 * when the diagram was rendered with `securityLevel: 'loose'`.
 *
 * @param svg - The cloned SVG element to sanitise (mutated in place).
 */
const sanitiseSvgForExport = (svg: SVGElement): void => {
  // Remove dangerous elements entirely
  const dangerousSelectors =
    'script, iframe, object, embed, link[rel="stylesheet"]';
  svg.querySelectorAll(dangerousSelectors).forEach((el) => el.remove());

  // Strip event-handler attributes (onclick, onload, onerror, etc.)
  svg.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on') && attr.name.length > 2) {
        el.removeAttribute(attr.name);
      }
    });
  });
};

/**
 * Options accepted by the {@link useMermaidDownload} composable.
 */
export interface UseMermaidDownloadOptions {
  /** Reactive reference to the diagram container's DOM id. */
  diagramId: string;
}

/**
 * Provides a `handleDownload` action that exports the rendered SVG
 * diagram in the requested format.
 *
 * **SVG** — Serialises the SVG element and triggers a direct blob
 * download.
 *
 * **PNG / JPEG** — Loads the serialised SVG into an `Image`, draws it
 * onto a `<canvas>`, and converts the canvas to a data URL for
 * download. A white background is composited for raster formats.
 *
 * @param options - Configuration with the diagram container id.
 * @returns An object with the `handleDownload` action.
 */
export function useMermaidDownload(options: UseMermaidDownloadOptions) {
  const handleDownload = async (format: DownloadFormat): Promise<void> => {
    const container = document.getElementById(options.diagramId);
    const svgElement = container?.querySelector('svg');

    if (!svgElement) {
      console.error('SVG element not found for download');
      return;
    }

    const svgClone = svgElement.cloneNode(true) as SVGElement;
    if (format !== 'svg') {
      svgClone.style.backgroundColor = 'white';
    }

    // Strip dangerous elements and event handlers before serialising
    sanitiseSvgForExport(svgClone);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.download = `diagram.${format}`;

    if (format === 'svg') {
      downloadLink.href = url;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const bbox = svgElement.viewBox.baseVal;
      let width = bbox?.width;
      let height = bbox?.height;

      if (!width || !height) {
        const rect = svgElement.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);

        const imageType = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(imageType);
        downloadLink.href = dataUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }

      URL.revokeObjectURL(url);
    };

    img.onerror = (error) => {
      console.error('Failed to load SVG for conversion', error);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return { handleDownload };
}
