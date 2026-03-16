/**
 * Ambient module declaration for plain CSS imports.
 *
 * Allows TypeScript to resolve `import "./style.css"` without raising
 * a "cannot find module" error. The import has no default export — it
 * simply triggers side-effects (e.g. the bundler inserts the stylesheet
 * into the document).
 *
 * @example
 * ```ts
 * import "./style.css"; // side-effect import
 * ```
 */
declare module "*.css";

/**
 * Ambient module declaration for Vite's `?inline` CSS import suffix.
 *
 * When a CSS file is imported with the `?inline` query parameter, Vite
 * returns the raw stylesheet text as a string instead of injecting it
 * into the document. This is used by {@link ensureStylesInjected} in
 * `styleManager.ts` to programmatically inject styles into the `<head>`
 * at runtime, which is necessary for library consumers who don't have
 * control over the host application's build pipeline.
 *
 * @example
 * ```ts
 * import styles from "./style.css?inline";
 * console.log(typeof styles); // "string"
 * ```
 */
declare module "*.css?inline" {
  /** The full CSS text content of the imported stylesheet. */
  const content: string;
  export default content;
}
