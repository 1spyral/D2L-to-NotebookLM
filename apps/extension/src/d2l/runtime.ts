import type { RuntimeLike, StorageAreaLike } from "./types";

function getRuntime(): RuntimeLike | null {
  const chromeRuntime = (globalThis as { chrome?: { runtime?: RuntimeLike } }).chrome?.runtime;
  const browserRuntime = (globalThis as { browser?: { runtime?: RuntimeLike } }).browser?.runtime;
  return chromeRuntime || browserRuntime || null;
}

function getLocalStorageArea(): StorageAreaLike | null {
  const chromeStorage = (globalThis as { chrome?: { storage?: { local?: StorageAreaLike } } })
    .chrome?.storage?.local;
  const browserStorage = (
    globalThis as {
      browser?: { storage?: { local?: StorageAreaLike } };
    }
  ).browser?.storage?.local;
  return chromeStorage || browserStorage || null;
}

function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return typeof value === "object" && value !== null && "then" in value;
}

export async function runtimeSendMessage<T>(message: unknown): Promise<T | undefined> {
  const runtime = getRuntime();
  if (!runtime?.sendMessage) {
    return undefined;
  }

  const maybePromise = runtime.sendMessage(message);
  if (isPromiseLike<T>(maybePromise)) {
    return maybePromise;
  }

  return new Promise((resolve, reject) => {
    runtime.sendMessage(message, (response) => {
      const lastError = (
        (globalThis as { chrome?: { runtime?: { lastError?: { message?: string } } } }).chrome
          ?.runtime?.lastError ?? (runtime.lastError as { message?: string } | undefined)
      )?.message;

      if (lastError) {
        reject(new Error(lastError));
        return;
      }

      resolve(response as T | undefined);
    });
  });
}

export async function storageLocalGet<T extends Record<string, unknown>>(defaults: T): Promise<T> {
  const storageArea = getLocalStorageArea();
  if (!storageArea) {
    return defaults;
  }

  const maybePromise = storageArea.get(defaults);
  if (isPromiseLike<T>(maybePromise)) {
    return maybePromise;
  }

  return new Promise((resolve, reject) => {
    storageArea.get(defaults, (items) => {
      const lastError = (
        globalThis as { chrome?: { runtime?: { lastError?: { message?: string } } } }
      ).chrome?.runtime?.lastError?.message;

      if (lastError) {
        reject(new Error(lastError));
        return;
      }

      resolve((items as T) ?? defaults);
    });
  });
}

export async function storageLocalSet(items: Record<string, unknown>): Promise<void> {
  const storageArea = getLocalStorageArea();
  if (!storageArea) {
    return;
  }

  const maybePromise = storageArea.set(items);
  if (isPromiseLike<void>(maybePromise)) {
    await maybePromise;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    storageArea.set(items, () => {
      const lastError = (
        globalThis as { chrome?: { runtime?: { lastError?: { message?: string } } } }
      ).chrome?.runtime?.lastError?.message;

      if (lastError) {
        reject(new Error(lastError));
        return;
      }

      resolve();
    });
  });
}
