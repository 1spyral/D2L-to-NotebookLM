import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, copyFileSync, watch } from "node:fs";
import { resolve } from "node:path";

const target = process.argv[2] ?? "firefox";
const outDir = `dist/${target}`;

const isWindows = process.platform === "win32";
const env = { ...process.env, OUT_DIR: outDir };

const manifestMap = {
  chrome: "config/manifest.chrome.json",
  firefox: "config/manifest.firefox.json",
  safari: "config/manifest.safari.json",
};

const manifestPath = manifestMap[target];
if (!manifestPath) {
  console.error(`Unknown target: ${target}`);
  process.exit(1);
}

// Initial build so manifest and bundles exist before web-ext runs.
const initial = spawnSync(isWindows ? "npx.cmd" : "npx", ["vite", "build"], {
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
    console.log(`[dev] Copied manifest: ${manifestDest}`);
  }, 50);
});

const watchEnv = { ...env, VITE_WATCH: "1" };
const vite = spawn(isWindows ? "npx.cmd" : "npx", ["vite", "build", "--watch"], {
  stdio: "inherit",
  env: watchEnv,
});

const webExtArgs = [
  "run",
  "--source-dir",
  outDir,
  ...(target === "chrome"
    ? ["--target=chromium"]
    : target === "firefox"
      ? ["--target=firefox-desktop"]
      : []),
];

const webExt = spawn(isWindows ? "npx.cmd" : "npx", ["web-ext", ...webExtArgs], {
  stdio: "inherit",
});

function shutdown(code) {
  if (vite.exitCode == null) vite.kill("SIGINT");
  if (webExt.exitCode == null) webExt.kill("SIGINT");
  process.exit(code ?? 0);
}

vite.on("exit", (code) => shutdown(code ?? 1));
webExt.on("exit", (code) => shutdown(code ?? 1));
