import {
  backendRoot,
  canRun,
  ensureEnvFiles,
  ensureMysqlInstalled,
  run,
  validateLocalEnvConfig,
} from "./shared.mjs";

try {
  ensureEnvFiles();
  validateLocalEnvConfig();
  ensureMysqlInstalled();

  if (!canRun("npm --version")) {
    throw new Error("npm is required but not installed.");
  }

  run("npm run db:check", { cwd: backendRoot });
  console.log("Local doctor check passed.");
} catch (error) {
  console.error(`Local doctor failed: ${error.message}`);
  console.error("Follow LOCAL_SETUP.md to finish MySQL setup if this is the first run.");
  process.exit(1);
}
