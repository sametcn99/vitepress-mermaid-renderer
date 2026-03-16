/**
 * @module styleManager
 *
 * Responsible for injecting the library's CSS stylesheet into the host
 * document's `<head>` at runtime. Because this package is consumed as a
 * VitePress plugin, the host application doesn't import the CSS directly.
 * Instead, the library injects a `<style>` element on first use, ensuring
 * the Mermaid diagram UI (toolbar, error overlay, fullscreen backdrop, etc.)
 * is always styled correctly.
 *
 * The raw CSS text is obtained via Vite's `?inline` import suffix (see
 * `types/css.d.ts`), which returns the stylesheet content as a string
 * rather than injecting it automatically.
 *
 * @example
 * ```ts
 * import { ensureStylesInjected } from "./styleManager";
 *
 * // Called once during plugin initialization (see src/index.ts)
 * ensureStylesInjected();
 * ```
 */
import styles from "./style.css?inline";

/**
 * Unique DOM id assigned to the injected `<style>` element.
 * Used to prevent duplicate injection when the module is evaluated
 * more than once (e.g. during HMR or when multiple entry points exist).
 *
 * @constant {string}
 */
const STYLE_ELEMENT_ID = "vitepress-mermaid-renderer-styles";

/**
 * Module-level flag that short-circuits the DOM lookup after the first
 * successful injection, avoiding unnecessary `getElementById` calls on
 * every subsequent invocation.
 */
let injected = false;

/**
 * Ensures that the library's stylesheet is present in the document `<head>`.
 *
 * The function is idempotent — calling it multiple times has no additional
 * effect after the first successful injection. It gracefully handles
 * server-side rendering (SSR) contexts where `document` is not available
 * by silently returning.
 *
 * **How it works:**
 * 1. If the styles have already been injected (tracked by the module-level
 *    `injected` flag), the function returns immediately.
 * 2. If running in a non-browser environment (SSR), the function returns
 *    without side-effects.
 * 3. If a `<style>` element with the expected id already exists (e.g.
 *    injected by a previous module evaluation), the flag is set and the
 *    function returns.
 * 4. Otherwise, a new `<style>` element is created, filled with the raw
 *    CSS text imported from `style.css?inline`, and appended to `<head>`.
 *
 * This function is invoked automatically during module initialization in
 * `src/index.ts` and does not need to be called manually by consumers.
 *
 * @example
 * ```ts
 * import { ensureStylesInjected } from "./styleManager";
 *
 * // Safe to call multiple times — only the first call has an effect
 * ensureStylesInjected();
 * ensureStylesInjected(); // no-op
 * ```
 */
export const ensureStylesInjected = () => {
  if (injected || typeof document === "undefined") {
    return;
  }

  if (document.getElementById(STYLE_ELEMENT_ID)) {
    injected = true;
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  injected = true;
};
