import { createBuildWatch } from "./lib/buildUtils.mjs";

const { vite } = createBuildWatch({ logPrefix: "watch" });

function shutdown(code) {
  if (vite.exitCode == null) vite.kill("SIGINT");
  process.exit(code ?? 0);
}

vite.on("exit", (code) => shutdown(code ?? 1));
