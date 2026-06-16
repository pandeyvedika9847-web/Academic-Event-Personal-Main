const dotenv = require("dotenv");
const {
  DEFAULT_ALLOWED_ORIGIN,
  DEFAULT_DB_HOST,
  DEFAULT_DB_NAME,
  DEFAULT_DB_PASSWORD,
  DEFAULT_DB_PORT,
  DEFAULT_DB_USER,
  DEFAULT_FRONTEND_BASE_URL,
  DEFAULT_PORT,
  DEFAULT_TOKEN_TTL,
} = require("./constants");

dotenv.config();

const trimTrailingSlash = (value) => value.replace(/\/$/, "");

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || DEFAULT_PORT),
  DB_HOST: process.env.DB_HOST || DEFAULT_DB_HOST,
  DB_PORT: Number(process.env.DB_PORT || DEFAULT_DB_PORT),
  DB_NAME: process.env.DB_NAME || DEFAULT_DB_NAME,
  DB_USER: process.env.DB_USER || DEFAULT_DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD || DEFAULT_DB_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || DEFAULT_TOKEN_TTL,
  ADMIN_CODE: process.env.ADMIN_CODE || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_ALLOWED_HOSTED_DOMAIN: process.env.GOOGLE_ALLOWED_HOSTED_DOMAIN || "",
  FRONTEND_BASE_URL: trimTrailingSlash(
    process.env.FRONTEND_BASE_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      DEFAULT_FRONTEND_BASE_URL
  ),
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGIN)
    .split(",")
    .map((origin) => trimTrailingSlash(origin.trim()))
    .filter(Boolean),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_EMAIL: process.env.SMTP_EMAIL || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
});

function validateEnv() {
  const missing = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "JWT_SECRET"].filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return env;
}

module.exports = { env, validateEnv };
