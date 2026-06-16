const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const GOOGLE_NONCE_COOKIE = "google_oauth_nonce";
const GOOGLE_SIGNUP_COOKIE = "google_signup";
const GOOGLE_COOKIE_PATH = "/api/auth/google";
const GOOGLE_NONCE_TTL_MS = 5 * 60 * 1000;
const GOOGLE_SIGNUP_TTL_SECONDS = 15 * 60;
const GOOGLE_SIGNUP_AUDIENCE = "google-signup";
const GOOGLE_SIGNUP_PURPOSE = "complete-google-profile";
const MAX_CREDENTIAL_LENGTH = 8192;
const MAX_NONCE_LENGTH = 128;
const ALLOWED_ROLES = new Set(["student", "faculty", "admin"]);
const PROFILE_FIELDS = new Set([
  "fullName",
  "role",
  "phone",
  "department",
  "rollNumber",
  "year",
  "designation",
  "facultyId",
  "researchDomain",
  "supervisor",
  "adminCode",
]);

let googleClient;

class GoogleAuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "GoogleAuthError";
    this.statusCode = statusCode;
  }
}

function getGoogleCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge,
    path: GOOGLE_COOKIE_PATH,
  };
}

function getGoogleClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    path: GOOGLE_COOKIE_PATH,
  };
}

function createNonce() {
  return crypto.randomBytes(32).toString("hex");
}

function hashNonce(nonce) {
  return crypto.createHash("sha256").update(nonce, "utf8").digest("hex");
}

function assertMatchingNonce(rawNonce, hashedNonce) {
  const nonce = String(rawNonce || "");
  const storedHash = String(hashedNonce || "");

  if (!nonce || nonce.length > MAX_NONCE_LENGTH || !storedHash || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    throw new GoogleAuthError("Google sign-in session expired. Please try again.", 400);
  }

  const expected = Buffer.from(hashNonce(nonce), "hex");
  const actual = Buffer.from(storedHash, "hex");

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new GoogleAuthError("Google sign-in session expired. Please try again.", 400);
  }
}

function safeString(value, maxLength) {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  if (text.length > maxLength) {
    throw new GoogleAuthError("Submitted profile details are too long.", 400);
  }
  return text;
}

function optionalString(value, maxLength) {
  const text = safeString(value, maxLength);
  return text || null;
}

function safeGooglePicture(value) {
  const text = safeString(value, 512);
  if (!text) return "";
  return text.startsWith("https://") ? text : "";
}

function requireGoogleClientId() {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new GoogleAuthError("Google sign-in is not configured.", 503);
  }
}

function getGoogleClient() {
  requireGoogleClientId();

  if (!googleClient) {
    try {
      const { OAuth2Client } = require("google-auth-library");
      googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    } catch (error) {
      if (error.code === "MODULE_NOT_FOUND") {
        throw new GoogleAuthError("Google sign-in dependency is not installed. Run backend dependency installation before enabling Google sign-in.", 503);
      }
      throw error;
    }
  }

  return googleClient;
}

function validateGooglePayload(payload, expectedNonce) {
  if (!payload || typeof payload !== "object") {
    throw new GoogleAuthError("Invalid Google credentials.", 401);
  }

  const googleId = safeString(payload.sub, 255);
  const email = safeString(payload.email, 255).toLowerCase();
  const name = safeString(payload.name, 120);
  const picture = safeGooglePicture(payload.picture);
  const hostedDomain = safeString(payload.hd, 255);
  const nonce = safeString(payload.nonce, MAX_NONCE_LENGTH);

  if (!googleId || !email) {
    throw new GoogleAuthError("Invalid Google credentials.", 401);
  }

  if (payload.email_verified !== true) {
    throw new GoogleAuthError("Google email is not verified.", 401);
  }

  if (!nonce || nonce !== expectedNonce) {
    throw new GoogleAuthError("Google sign-in session expired. Please try again.", 400);
  }

  if (env.GOOGLE_ALLOWED_HOSTED_DOMAIN && hostedDomain !== env.GOOGLE_ALLOWED_HOSTED_DOMAIN) {
    throw new GoogleAuthError("This Google account is not allowed for this application.", 403);
  }

  return {
    googleId,
    email,
    fullName: name || email.split("@")[0],
    avatar: picture,
    hostedDomain,
  };
}

async function verifyGoogleCredential(credential, nonce) {
  const idToken = safeString(credential, MAX_CREDENTIAL_LENGTH);
  const expectedNonce = safeString(nonce, MAX_NONCE_LENGTH);

  if (!idToken) {
    throw new GoogleAuthError("Google credential is required.", 400);
  }

  if (!expectedNonce) {
    throw new GoogleAuthError("Google sign-in session expired. Please try again.", 400);
  }

  const client = getGoogleClient();
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new GoogleAuthError("Invalid Google credentials.", 401);
  }

  return validateGooglePayload(ticket.getPayload(), expectedNonce);
}

function createGoogleSignupToken(profile) {
  return jwt.sign(
    {
      purpose: GOOGLE_SIGNUP_PURPOSE,
      sub: profile.googleId,
      email: profile.email,
      fullName: profile.fullName,
      avatar: profile.avatar || "",
    },
    env.JWT_SECRET,
    {
      expiresIn: GOOGLE_SIGNUP_TTL_SECONDS,
      audience: GOOGLE_SIGNUP_AUDIENCE,
      issuer: "academic-events-backend",
    }
  );
}

function verifyGoogleSignupToken(token) {
  if (!token) {
    throw new GoogleAuthError("Google profile session expired. Please sign in with Google again.", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      audience: GOOGLE_SIGNUP_AUDIENCE,
      issuer: "academic-events-backend",
    });
  } catch {
    throw new GoogleAuthError("Google profile session expired. Please sign in with Google again.", 401);
  }

  if (payload.purpose !== GOOGLE_SIGNUP_PURPOSE) {
    throw new GoogleAuthError("Google profile session expired. Please sign in with Google again.", 401);
  }

  return {
    googleId: safeString(payload.sub, 255),
    email: safeString(payload.email, 255).toLowerCase(),
    fullName: safeString(payload.fullName, 120),
    avatar: safeGooglePicture(payload.avatar),
  };
}

function rejectUnknownProfileFields(body) {
  for (const key of Object.keys(body || {})) {
    if (!PROFILE_FIELDS.has(key)) {
      throw new GoogleAuthError(`Unexpected profile field: ${key}`, 400);
    }
  }
}

function buildGoogleProfilePayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new GoogleAuthError("Profile details are required.", 400);
  }

  rejectUnknownProfileFields(body);

  const role = safeString(body.role, 20);
  const fullName = safeString(body.fullName, 120);
  const department = safeString(body.department, 160);

  if (!ALLOWED_ROLES.has(role)) {
    throw new GoogleAuthError("Please select a valid role.", 400);
  }

  if (!fullName) {
    throw new GoogleAuthError("Full name is required.", 400);
  }

  if (!department) {
    throw new GoogleAuthError("Department is required.", 400);
  }

  if (role === "student" && !safeString(body.year, 80)) {
    throw new GoogleAuthError("Program and year are required for student accounts.", 400);
  }

  if (role === "faculty" && !safeString(body.designation, 80)) {
    throw new GoogleAuthError("Designation is required for faculty accounts.", 400);
  }

  if (role === "admin") {
    const adminCode = safeString(body.adminCode, 120);
    if (!env.ADMIN_CODE || adminCode !== env.ADMIN_CODE) {
      throw new GoogleAuthError("Invalid admin authorization code.", 400);
    }
  }

  return {
    fullName,
    role,
    phone: optionalString(body.phone, 40),
    department,
    rollNumber: role === "student" ? optionalString(body.rollNumber, 80) : null,
    year: role === "student" ? safeString(body.year, 80) : null,
    designation: role === "faculty" ? safeString(body.designation, 80) : optionalString(body.designation, 80),
    facultyId: role === "faculty" ? optionalString(body.facultyId, 80) : null,
    researchDomain: optionalString(body.researchDomain, 120),
    supervisor: role === "student" ? optionalString(body.supervisor, 120) : null,
  };
}

module.exports = {
  GOOGLE_NONCE_COOKIE,
  GOOGLE_SIGNUP_COOKIE,
  GOOGLE_NONCE_TTL_MS,
  GOOGLE_SIGNUP_TTL_SECONDS,
  GoogleAuthError,
  createNonce,
  hashNonce,
  assertMatchingNonce,
  getGoogleCookieOptions,
  getGoogleClearCookieOptions,
  verifyGoogleCredential,
  createGoogleSignupToken,
  verifyGoogleSignupToken,
  buildGoogleProfilePayload,
  validateGooglePayload,
};
