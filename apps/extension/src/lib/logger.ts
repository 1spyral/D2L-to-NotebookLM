export function logDebug(...args: unknown[]): void {
  if (!import.meta.env.DEV) return;
  console.log(...args);
}
