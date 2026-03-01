import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, watch } from "node:fs";
import { resolve } from "node:path";

const manifestMap = {
  chrome: "config/manifest.chrome.json",
  firefox: "config/manifest.firefox.json",
  safari: "config/manifest.safari.json",
};

const isWindows = process.platform === "win32";
const npxCommand = isWindows ? "npx.cmd" : "npx";

export function createBuildWatch({ logPrefix }) {
  const target = process.argv[2] ?? "firefox";
  const outDir = `dist/${target}`;
  const manifestPath = manifestMap[target];
  if (!manifestPath) {
    console.error(`Unknown target: ${target}`);
    process.exit(1);
  }

  const env = { ...process.env, OUT_DIR: outDir };

  // Build once so manifest and bundles exist before entering watch mode.
  const initial = spawnSync(npxCommand, ["vite", "build"], {
    stdio: "inherit",
    env,
  });
  if (initial.status !== 0) {
    process.exit(initial.status ?? 1);
  }

  mkdirSync(outDir, { recursive: true });
  const manifestSource = resolve(manifestPath);
  const manifestDest = resolve(outDir, "manifest.json");
  copyFileSync(manifestSource, manifestDest);

  let manifestTimer = null;
  watch(manifestSource, () => {
    if (manifestTimer) clearTimeout(manifestTimer);
    manifestTimer = setTimeout(() => {
      copyFileSync(manifestSource, manifestDest);
      console.log(`[${logPrefix}] Copied manifest: ${manifestDest}`);
    }, 50);
  });

  const watchEnv = { ...env, VITE_WATCH: "1" };
  const vite = spawn(npxCommand, ["vite", "build", "--watch"], {
    stdio: "inherit",
    env: watchEnv,
  });

  return {
    target,
    outDir,
    vite,
    npxCommand,
  };
}
