import { createBuildWatch } from "./lib/buildUtils.mjs";

const { viteProcesses } = createBuildWatch({ logPrefix: "watch" });

let hasShutdown = false;
function shutdown(code) {
  if (hasShutdown) return;
  hasShutdown = true;
  for (const vite of viteProcesses) {
    if (vite.exitCode == null) vite.kill("SIGINT");
  }
  process.exit(code ?? 0);
}

for (const vite of viteProcesses) {
  vite.on("exit", (code) => shutdown(code ?? 1));
}
