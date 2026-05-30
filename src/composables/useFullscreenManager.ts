/**
 * @module useFullscreenManager
 *
 * Singleton event manager for browser fullscreen state changes.
 *
 * Instead of each `MermaidDiagram` instance registering four
 * `fullscreenchange` event listeners (plus vendor-prefixed variants),
 * this module registers **one** set of listeners on `document` and
 * broadcasts fullscreen-state changes to all subscribed handlers.
 *
 * This reduces the number of event listeners from `4 × N` (where `N`
 * is the number of diagrams on the page) to exactly 4, regardless of
 * how many diagrams are rendered.
 *
 * @example
 * ```ts
 * import { onFullscreenChange, offFullscreenChange } from "./useFullscreenManager";
 *
 * // Subscribe
 * onFullscreenChange(myHandler);
 *
 * // Unsubscribe
 * offFullscreenChange(myHandler);
 * ```
 */

/** Callback signature for fullscreen-state change handlers. */
type FullscreenChangeHandler = () => void;

/** Set of active subscriber callbacks. */
const subscribers = new Set<FullscreenChangeHandler>();

/** Whether the global listeners have been attached. */
let listenersAttached = false;

/**
 * Broadcasts the current fullscreen state to all subscribed handlers.
 */
function notifySubscribers(): void {
  for (const handler of subscribers) {
    try {
      handler();
    } catch (error) {
      console.error('Fullscreen change handler error:', error);
    }
  }
}

/**
 * Attaches the global `fullscreenchange` event listeners (including
 * vendor-prefixed variants) if they have not already been attached.
 */
function ensureListeners(): void {
  if (listenersAttached || typeof document === 'undefined') return;

  document.addEventListener('fullscreenchange', notifySubscribers);
  document.addEventListener('webkitfullscreenchange', notifySubscribers);
  document.addEventListener('mozfullscreenchange', notifySubscribers);
  document.addEventListener('MSFullscreenChange', notifySubscribers);

  listenersAttached = true;
}

/**
 * Subscribes a handler to fullscreen-state changes.
 *
 * The first call also attaches the global event listeners.
 * Subsequent calls only register the handler — no extra listeners
 * are added.
 *
 * @param handler - The callback to invoke when fullscreen state changes.
 */
export function onFullscreenChange(handler: FullscreenChangeHandler): void {
  ensureListeners();
  subscribers.add(handler);
}

/**
 * Unsubscribes a handler from fullscreen-state changes.
 *
 * If the handler was not previously subscribed, this is a no-op.
 * When the last handler is removed, the global event listeners
 * are detached to avoid leaking memory on SPA navigations.
 *
 * @param handler - The callback to remove.
 */
export function offFullscreenChange(handler: FullscreenChangeHandler): void {
  subscribers.delete(handler);

  // Clean up global listeners when no subscribers remain.
  if (
    subscribers.size === 0 &&
    listenersAttached &&
    typeof document !== 'undefined'
  ) {
    document.removeEventListener('fullscreenchange', notifySubscribers);
    document.removeEventListener('webkitfullscreenchange', notifySubscribers);
    document.removeEventListener('mozfullscreenchange', notifySubscribers);
    document.removeEventListener('MSFullscreenChange', notifySubscribers);
    listenersAttached = false;
  }
}

/**
 * Resets the singleton state (subscribers + listener flag) so that
 * subsequent `onFullscreenChange` calls re-attach the global listeners.
 *
 * Intended **only** for test teardown — do not call in production code.
 *
 * @internal
 */
export function _resetFullscreenManager(): void {
  if (listenersAttached && typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', notifySubscribers);
    document.removeEventListener('webkitfullscreenchange', notifySubscribers);
    document.removeEventListener('mozfullscreenchange', notifySubscribers);
    document.removeEventListener('MSFullscreenChange', notifySubscribers);
  }
  subscribers.clear();
  listenersAttached = false;
}
