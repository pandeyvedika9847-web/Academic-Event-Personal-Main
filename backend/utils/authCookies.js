const { env } = require("../config/env");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 7 * ONE_DAY_MS,
    path: "/",
  };
}

module.exports = { getAuthCookieOptions };
