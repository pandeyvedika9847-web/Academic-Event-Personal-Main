import { backendRoot, ensureEnvFiles, ensureMysqlInstalled, run } from "./shared.mjs";

try {
  ensureEnvFiles();
  ensureMysqlInstalled();
  run("npm run db:bootstrap", { cwd: backendRoot });
  run("npm run db:sync", { cwd: backendRoot });
  run("npm run db:migrate:gauth", { cwd: backendRoot });
  console.log("Local setup completed.");
} catch (error) {
  console.error(`Local setup failed: ${error.message}`);
  console.error("If MySQL is installed but the database does not exist yet, create it using LOCAL_SETUP.md.");
  process.exit(1);
}
