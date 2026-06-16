import { ensureRequiredPortsAvailable, run } from "./shared.mjs";

try {
  await ensureRequiredPortsAvailable();
  run("node scripts/local/setup.mjs");
  run('npx concurrently -k -n backend,frontend "npm --prefix backend run dev" "npm run dev:frontend"');
} catch (error) {
  console.error(`Local start failed: ${error.message}`);
  process.exit(1);
}
