const test = require("node:test");
const assert = require("node:assert/strict");

const { getAuthCookieOptions } = require("../utils/authCookies");

test("getAuthCookieOptions returns secure defaults for local development", () => {
  const options = getAuthCookieOptions();

  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
  assert.equal(options.sameSite, "lax");
  assert.equal(options.secure, false);
  assert.ok(options.maxAge > 0);
});
