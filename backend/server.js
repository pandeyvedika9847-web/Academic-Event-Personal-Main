"use strict";

const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const helmet       = require("helmet");
const compression  = require("compression");
const morgan       = require("morgan");
const { connectDB } = require("./config/db");
const { env, validateEnv } = require("./config/env");
const { APP_NAME } = require("./config/constants");
const { authLimiter, globalLimiter } = require("./middleware/rateLimit");

validateEnv();

const app = express();
app.set("io", null);

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database Connection Error:", error);
    res.status(500).json({ success: false, message: "Database connection failed", error: error.message });
  }
});

// Trust proxy for rate limiting (Vercel uses proxies)
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// Compression
app.use(compression({ level: 6 }));

// Body parser
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Cookie parser
app.use(cookieParser());

// CORS configuration
const allowedOrigins = env.ALLOWED_ORIGINS;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// Structured request logging
app.use(morgan("combined", {
  skip: (req) => req.path === "/api/health",
}));

// Global Limiter
app.use(globalLimiter);

// Routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/events",    require("./routes/events"));
app.use("/api/users",     require("./routes/users"));
app.use("/api/analytics", require("./routes/analytics"));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: `${APP_NAME} API is healthy`,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, _next) => {
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error("Error:", err);
  res.status(err.status || 500).json({
      success: false,
      message: env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

module.exports = app;
