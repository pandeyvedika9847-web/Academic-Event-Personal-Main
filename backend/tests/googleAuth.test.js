const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const { User } = require("../db/models");
const {
  GoogleAuthError,
  assertMatchingNonce,
  buildGoogleProfilePayload,
  hashNonce,
  validateGooglePayload,
} = require("../utils/googleAuth");

test("Google nonce verification accepts only the matching nonce", () => {
  const nonce = "a".repeat(64);
  assert.doesNotThrow(() => assertMatchingNonce(nonce, hashNonce(nonce)));
  assert.throws(() => assertMatchingNonce("b".repeat(64), hashNonce(nonce)), GoogleAuthError);
});

test("Google payload validation requires verified email and matching nonce", () => {
  const payload = {
    sub: "google-subject-1",
    email: "USER@EXAMPLE.EDU",
    email_verified: true,
    name: "Verified User",
    picture: "https://lh3.googleusercontent.com/avatar",
    nonce: "nonce-1",
  };

  const profile = validateGooglePayload(payload, "nonce-1");
  assert.equal(profile.googleId, "google-subject-1");
  assert.equal(profile.email, "user@example.edu");
  assert.equal(profile.fullName, "Verified User");
  assert.equal(profile.avatar, "https://lh3.googleusercontent.com/avatar");

  assert.throws(() => validateGooglePayload({ ...payload, email_verified: false }, "nonce-1"), GoogleAuthError);
  assert.throws(() => validateGooglePayload(payload, "different-nonce"), GoogleAuthError);
});

test("Google profile payload rejects unknown fields and enforces role requirements", () => {
  assert.throws(() => buildGoogleProfilePayload({ role: "student", fullName: "A", department: "CSE", year: "B.Tech 1st Year", isAdmin: true }), GoogleAuthError);
  assert.throws(() => buildGoogleProfilePayload({ role: "student", fullName: "A", department: "CSE" }), GoogleAuthError);
  assert.throws(() => buildGoogleProfilePayload({ role: "faculty", fullName: "A", department: "CSE" }), GoogleAuthError);

  const student = buildGoogleProfilePayload({
    role: "student",
    fullName: " Test Student ",
    department: "Computer Science & Engineering",
    year: "B.Tech 1st Year",
    rollNumber: " 21CS1001 ",
  });

  assert.equal(student.fullName, "Test Student");
  assert.equal(student.rollNumber, "21CS1001");
  assert.equal(student.designation, null);
});

test("User password hooks allow Google-only users and still hash local passwords", async () => {
  const googleUser = User.build({
    fullName: "Google User",
    email: "google@example.edu",
    password: null,
    role: "student",
    department: "Computer Science & Engineering",
    googleId: "google-subject-2",
  });

  await User.runHooks("beforeCreate", googleUser);
  assert.equal(googleUser.password, null);

  const localUser = User.build({
    fullName: "Local User",
    email: "local@example.edu",
    password: "correct horse battery staple",
    role: "student",
    department: "Computer Science & Engineering",
  });

  await User.runHooks("beforeCreate", localUser);
  assert.notEqual(localUser.password, "correct horse battery staple");
  assert.equal(await bcrypt.compare("correct horse battery staple", localUser.password), true);
});
