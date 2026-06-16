const APP_NAME = process.env.APP_NAME || "Academic Events Hub";
const APP_SHORT_NAME = process.env.APP_SHORT_NAME || "AEH";

module.exports = {
  APP_NAME,
  APP_SHORT_NAME,
  DEFAULT_PORT: Number(process.env.PORT || 4000),
  DEFAULT_ALLOWED_ORIGIN: "http://localhost:3000",
  DEFAULT_FRONTEND_BASE_URL:
    process.env.FRONTEND_BASE_URL || "http://localhost:3000",
  DEFAULT_TOKEN_TTL: process.env.JWT_EXPIRES_IN || "7d",
  DEFAULT_FROM_NAME: process.env.FROM_NAME || APP_NAME,
  DEFAULT_DB_HOST: "127.0.0.1",
  DEFAULT_DB_PORT: 3306,
  DEFAULT_DB_NAME: "academic_events_local",
  DEFAULT_DB_USER: "academic_events",
  DEFAULT_DB_PASSWORD: "academic_events_local_password",
};
