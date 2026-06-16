const mysql = require("mysql2/promise");
const { env } = require("../config/env");

const COMMON_SOCKET_PATHS = [
  "/tmp/mysql.sock",
  "/opt/homebrew/var/mysql/mysql.sock",
  "/usr/local/var/mysql/mysql.sock",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildConnectionCandidates() {
  const rootUser = process.env.DB_ROOT_USER || "root";
  const providedPassword = process.env.DB_ROOT_PASSWORD ?? "";
  const passwords = [...new Set([providedPassword, ""])];

  const candidates = passwords.map((password) => ({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: rootUser,
    password,
    multipleStatements: true,
  }));

  if (process.platform === "darwin") {
    for (const socketPath of COMMON_SOCKET_PATHS) {
      for (const password of passwords) {
        candidates.push({
          socketPath,
          user: rootUser,
          password,
          multipleStatements: true,
        });
      }
    }
  }

  return candidates;
}

async function waitForMysqlConnection() {
  const candidates = buildConnectionCandidates();
  let lastError = null;

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    for (const config of candidates) {
      try {
        return await mysql.createConnection(config);
      } catch (error) {
        lastError = error;
      }
    }

    await sleep(1500);
  }

  throw lastError;
}

async function run() {
  let connection;

  try {
    connection = await waitForMysqlConnection();

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(
      `CREATE USER IF NOT EXISTS '${env.DB_USER}'@'localhost' IDENTIFIED BY ?`,
      [env.DB_PASSWORD]
    );
    await connection.query(
      `CREATE USER IF NOT EXISTS '${env.DB_USER}'@'127.0.0.1' IDENTIFIED BY ?`,
      [env.DB_PASSWORD]
    );
    await connection.query(
      `ALTER USER '${env.DB_USER}'@'localhost' IDENTIFIED BY ?`,
      [env.DB_PASSWORD]
    );
    await connection.query(
      `ALTER USER '${env.DB_USER}'@'127.0.0.1' IDENTIFIED BY ?`,
      [env.DB_PASSWORD]
    );
    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${env.DB_NAME}\`.* TO '${env.DB_USER}'@'localhost'`
    );
    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${env.DB_NAME}\`.* TO '${env.DB_USER}'@'127.0.0.1'`
    );
    await connection.query("FLUSH PRIVILEGES");

    console.log(`Database '${env.DB_NAME}' is ready.`);
  } catch (error) {
    console.error(
      "Automatic MySQL bootstrap failed. Check DB_ROOT_USER/DB_ROOT_PASSWORD or follow LOCAL_SETUP.md.",
      error.message
    );
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
