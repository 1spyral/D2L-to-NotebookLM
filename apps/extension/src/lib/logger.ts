type ExtensionLogger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return (
    (globalThis as { __D2L_TO_NOTEBOOKLM_DEBUG__?: boolean }).__D2L_TO_NOTEBOOKLM_DEBUG__ === true
  );
}

export function logDebug(...args: unknown[]): void {
  if (!isDebugEnabled()) return;
  console.debug(...args);
}

export function logInfo(...args: unknown[]): void {
  if (!isDebugEnabled()) return;
  console.info(...args);
}

export function logWarn(...args: unknown[]): void {
  console.warn(...args);
}

export function logError(...args: unknown[]): void {
  console.error(...args);
}

export const extensionLogger: ExtensionLogger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
};
