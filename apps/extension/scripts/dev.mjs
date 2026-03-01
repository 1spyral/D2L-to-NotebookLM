import { spawn } from "node:child_process";
import { createBuildWatch } from "./lib/buildUtils.mjs";

const { target, outDir, vite, npxCommand } = createBuildWatch({ logPrefix: "dev" });

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

function shutdown(code) {
  if (vite.exitCode == null) vite.kill("SIGINT");
  if (webExt.exitCode == null) webExt.kill("SIGINT");
  process.exit(code ?? 0);
}

vite.on("exit", (code) => shutdown(code ?? 1));
webExt.on("exit", (code) => shutdown(code ?? 1));
