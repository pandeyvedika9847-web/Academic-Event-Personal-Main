const rateLimit = require("express-rate-limit");

const jsonMessage = (message) => ({ success: false, message });

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please slow down."),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    "Too many authentication attempts. Please try again later."
  ),
});

module.exports = { globalLimiter, authLimiter };
