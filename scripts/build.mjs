import { execSync } from "node:child_process";
import { mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const targets = {
  chrome: "config/manifest.chrome.json",
  firefox: "config/manifest.firefox.json",
  safari: "config/manifest.safari.json"
};

const args = process.argv.slice(2);
const selected = args.length ? args : Object.keys(targets);

for (const target of selected) {
  const manifestPath = targets[target];
  if (!manifestPath) {
    console.error(`Unknown target: ${target}`);
    process.exitCode = 1;
    continue;
  }

  const outDir = resolve("dist", target);
  const env = { ...process.env, OUT_DIR: outDir };

  console.log(`\nBuilding ${target} -> ${outDir}`);
  execSync("vite build", { stdio: "inherit", env });

  mkdirSync(outDir, { recursive: true });
  copyFileSync(resolve(manifestPath), resolve(outDir, "manifest.json"));
}
