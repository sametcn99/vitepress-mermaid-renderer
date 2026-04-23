import { afterEach, vi } from "vitest";

afterEach(() => {
  if (typeof document !== "undefined") {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
