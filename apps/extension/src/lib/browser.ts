type SyncStorage = {
  get: (defaults?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

type BrowserLike = {
  storage: { sync: SyncStorage };
};

const fallback: BrowserLike = {
  storage: {
    sync: {
      get: async (defaults = {}) => defaults,
      set: async () => {},
    },
  },
};

export const ext: BrowserLike =
  (globalThis as unknown as { browser?: BrowserLike }).browser ?? fallback;

// In extension environments, ensure the polyfill is loaded if only `chrome` exists.
if (
  typeof (globalThis as unknown as { browser?: unknown }).browser === "undefined" &&
  typeof (globalThis as unknown as { chrome?: unknown }).chrome !== "undefined"
) {
  import("webextension-polyfill").catch(() => {
    // Ignore if the polyfill can't load in non-extension contexts.
  });
}
