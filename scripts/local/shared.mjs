import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "../..");
export const backendRoot = path.join(projectRoot, "backend");
export const frontendPort = 3000;
export const backendPort = 4000;

export function run(command, options = {}) {
  execSync(command, {
    cwd: options.cwd || projectRoot,
    stdio: "inherit",
    shell: true,
  });
}

export function canRun(command, cwd = projectRoot) {
  try {
    execSync(command, { cwd, stdio: "ignore", shell: true });
    return true;
  } catch {
    return false;
  }
}

function commandOutput(command, cwd = projectRoot) {
  return execSync(command, {
    cwd,
    stdio: ["ignore", "pipe", "ignore"],
    shell: true,
    encoding: "utf8",
  }).trim();
}

function windowsMysqlExists() {
  return canRun('powershell -Command "Get-Command mysql -ErrorAction SilentlyContinue"')
    || existsSync("C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe")
    || existsSync("C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe")
    || existsSync("C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe");
}

function brewMysqlInstalled() {
  return canRun("brew list --versions mysql@8.0");
}

function macMysqlExists() {
  return canRun("mysql --version") || brewMysqlInstalled();
}

function resolveWindowsMysqlServiceName() {
  try {
    const serviceName = commandOutput(
      'powershell -Command "(Get-Service | Where-Object { $_.Name -like \'MySQL*\' } | Select-Object -First 1 -ExpandProperty Name)"'
    );

    return serviceName || null;
  } catch {
    return null;
  }
}

function upsertEnvValue(filePath, key, value) {
  const content = readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const nextLine = `${key}=${value}`;

  const nextContent = pattern.test(content)
    ? content.replace(pattern, nextLine)
    : `${content.trimEnd()}\n${nextLine}\n`;

  if (nextContent !== content) {
    writeFileSync(filePath, nextContent, "utf8");
  }
}

function normalizeLocalEnvFiles(rootEnv, backendEnv) {
  upsertEnvValue(rootEnv, "NEXT_PUBLIC_API_ORIGIN", `http://localhost:${backendPort}`);
  upsertEnvValue(rootEnv, "NEXT_PUBLIC_API_URL", `http://localhost:${backendPort}/api`);
  upsertEnvValue(rootEnv, "NEXT_PUBLIC_SOCKET_URL", `http://localhost:${backendPort}`);

  upsertEnvValue(backendEnv, "PORT", String(backendPort));
  upsertEnvValue(backendEnv, "FRONTEND_BASE_URL", `http://localhost:${frontendPort}`);
  upsertEnvValue(backendEnv, "ALLOWED_ORIGINS", `http://localhost:${frontendPort}`);
}

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");

  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((result, line) => {
      if (line.startsWith("#") || !line.includes("=")) {
        return result;
      }

      const [key, ...rest] = line.split("=");
      result[key.trim()] = rest.join("=").trim();
      return result;
    }, {});
}

export function getLocalEnvConfig() {
  const rootEnv = path.join(projectRoot, ".env.local");
  const backendEnv = path.join(backendRoot, ".env");

  return {
    frontend: existsSync(rootEnv) ? parseEnvFile(rootEnv) : {},
    backend: existsSync(backendEnv) ? parseEnvFile(backendEnv) : {},
  };
}

export function validateLocalEnvConfig() {
  const config = getLocalEnvConfig();

  const expectedFrontend = {
    NEXT_PUBLIC_API_ORIGIN: `http://localhost:${backendPort}`,
    NEXT_PUBLIC_API_URL: `http://localhost:${backendPort}/api`,
    NEXT_PUBLIC_SOCKET_URL: `http://localhost:${backendPort}`,
  };

  const expectedBackend = {
    PORT: String(backendPort),
    FRONTEND_BASE_URL: `http://localhost:${frontendPort}`,
    ALLOWED_ORIGINS: `http://localhost:${frontendPort}`,
  };

  for (const [key, value] of Object.entries(expectedFrontend)) {
    if (config.frontend[key] !== value) {
      throw new Error(`.env.local has ${key}=${config.frontend[key] || "<missing>"}. Expected ${value}.`);
    }
  }

  for (const [key, value] of Object.entries(expectedBackend)) {
    if (config.backend[key] !== value) {
      throw new Error(`backend/.env has ${key}=${config.backend[key] || "<missing>"}. Expected ${value}.`);
    }
  }

  if (process.platform === "win32" && !config.backend.DB_ROOT_PASSWORD) {
    throw new Error("backend/.env is missing DB_ROOT_PASSWORD for Windows. Set it to your MySQL root password, then try again.");
  }
}

export async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

export async function ensureRequiredPortsAvailable() {
  const ports = [
    { port: frontendPort, label: "frontend" },
    { port: backendPort, label: "backend" },
  ];

  for (const entry of ports) {
    const available = await isPortAvailable(entry.port);
    if (!available) {
      throw new Error(`Port ${entry.port} is already in use. Stop the existing ${entry.label} process and try again.`);
    }
  }
}

function ensureMysqlRunningOnMac() {
  if (brewMysqlInstalled()) {
    run("brew services start mysql@8.0");
    return;
  }

  if (canRun("mysql.server --version")) {
    run("mysql.server start");
    return;
  }

  if (canRun("mysqladmin ping")) {
    return;
  }

  throw new Error(
    "MySQL was found on this Mac, but it is not a Homebrew mysql@8.0 install and could not be started automatically. Start MySQL manually, or install it with 'brew install mysql@8.0'."
  );
}

function ensureMysqlRunningOnWindows() {
  const serviceName = resolveWindowsMysqlServiceName();

  if (serviceName) {
    run(`powershell -Command "Start-Service ${serviceName}"`);
    return;
  }

  throw new Error(
    "MySQL appears to be installed on Windows, but no MySQL Windows service was found. Open Services and start the MySQL service, then run 'npm run local:start' again."
  );
}

export function ensureEnvFiles() {
  const rootEnv = path.join(projectRoot, ".env.local");
  const rootExample = path.join(projectRoot, ".env.example");
  const backendEnv = path.join(backendRoot, ".env");
  const backendExample = path.join(backendRoot, ".env.example");

  if (!existsSync(rootEnv) && existsSync(rootExample)) {
    copyFileSync(rootExample, rootEnv);
  }

  if (!existsSync(backendEnv) && existsSync(backendExample)) {
    copyFileSync(backendExample, backendEnv);
  }

  if (existsSync(rootEnv) && existsSync(backendEnv)) {
    normalizeLocalEnvFiles(rootEnv, backendEnv);
  }
}

export function ensureMysqlInstalled() {
  if (process.platform === "darwin") {
    if (!macMysqlExists()) {
      if (!canRun("brew --version")) {
        throw new Error("Homebrew is required on macOS. Install it from https://brew.sh first.");
      }
      run("brew install mysql@8.0");
    }
    ensureMysqlRunningOnMac();
    return;
  }

  if (process.platform === "win32") {
    if (!windowsMysqlExists() && !canRun("mysql --version")) {
      if (!canRun("winget --version")) {
        throw new Error("winget is required on Windows to install MySQL.");
      }
      run("winget install Oracle.MySQL");
    }
    ensureMysqlRunningOnWindows();
    return;
  }

  throw new Error(`Unsupported OS for automated local MySQL setup: ${process.platform}`);
}
