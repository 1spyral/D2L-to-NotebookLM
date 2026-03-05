import { spawn } from "node:child_process";
import { createBuildWatch } from "./lib/buildUtils.mjs";

const { target, outDir, viteProcesses, npxCommand } = createBuildWatch({ logPrefix: "dev" });

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

const webExt = spawn(npxCommand, ["web-ext", ...webExtArgs], {
  stdio: "inherit",
});

let hasShutdown = false;
function shutdown(code) {
  if (hasShutdown) return;
  hasShutdown = true;
  for (const vite of viteProcesses) {
    if (vite.exitCode == null) vite.kill("SIGINT");
  }
  if (webExt.exitCode == null) webExt.kill("SIGINT");
  process.exit(code ?? 0);
}

for (const vite of viteProcesses) {
  vite.on("exit", (code) => shutdown(code ?? 1));
}
webExt.on("exit", (code) => shutdown(code ?? 1));
