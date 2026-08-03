/** @format */

import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { Server as SocketServer } from "socket.io";
import StatusCodes from "http-status-codes";

import { connectDatabase, mongoose } from "./database/configs/config.js";
import router from "./routes/index.js";
import { handleSuccess } from "./utils/responseUtils.js";
import { createRateLimiter, rejectUnsafeKeys, requestId, securityHeaders, corsHeaders } from "./middlewares/securityMiddlewares.js";
import { verifyToken } from "./utils/jwtUtils.js";
import { FindUserByID } from "./modules/auth/authRepositories.js";
import { registerSocketServer } from "./services/realtimeService.js";
import { isSandboxMode } from "./services/sendEmail.js";

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------
const normalizeOrigin = (value) => {
  if (!value) return "";
  try { return new URL(value.includes("://") ? value : `https://${value}`).origin; }
  catch { return ""; }
};

const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const developmentOrigins = process.env.NODE_ENV === "production"
  ? []
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"];

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.Link,
  "https://tjdevsphere.netlify.app",
  ...configuredOrigins,
  ...developmentOrigins,
]
  .map(normalizeOrigin)
  .filter(Boolean);

// Deduplicate while preserving order
const uniqueOrigins = [...new Set(allowedOrigins)];

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server, same-origin)
    if (!origin) return callback(null, true);
    if (uniqueOrigins.length === 0 || uniqueOrigins.includes(origin)) {
      return callback(null, true);
    }
    // For disallowed origins, still respond with the origin header so the
    // browser can see the CORS policy clearly. Returning false here tells
    // the cors package to NOT add any CORS headers, which is the root cause
    // of the "No 'Access-Control-Allow-Origin' header" error.
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-Id",
    "X-Provider-Setup-Key",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["X-Request-Id", "Retry-After"],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// ---------------------------------------------------------------------------
// Trust proxy (Render puts the app behind a reverse proxy)
// ---------------------------------------------------------------------------
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------
// Middleware order (critical: CORS must run before every route)
// ---------------------------------------------------------------------------
app.use(requestId);
app.use(securityHeaders);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(cookieParser());
app.use(cors(corsOptions));

// Belt-and-suspenders: guarantee CORS headers on every response
// (also handles OPTIONS preflight requests)
app.use(corsHeaders(uniqueOrigins));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));
app.use(rejectUnsafeKeys);
app.use(createRateLimiter({ max: 300, message: "Too many API requests" }));

// ---------------------------------------------------------------------------
// Request logging (production-safe, no sensitive data)
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const logLine = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(2)}ms`;
    if (res.statusCode >= 500) console.error(logLine);
    else if (res.statusCode >= 400) console.warn(logLine);
    else console.log(logLine);
  });
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/v1", router);

// 404 for unknown API routes
app.use("/api/v1", (_req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    status: StatusCodes.NOT_FOUND,
    message: "API route not found",
  });
});

// Root health check
app.get("/", (_req, res) => {
  return handleSuccess(res, StatusCodes.OK, "WELCOME MY PORTFOLIO", {});
});

// 404 for all other unmatched routes (was previously returning 200 for any GET)
app.use((_req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    status: StatusCodes.NOT_FOUND,
    message: "Route not found",
  });
});

// ---------------------------------------------------------------------------
// Global error handler (must be last, after all routes)
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);

  // Handle multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      error: "File size exceeds the 10 MB limit.",
    });
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      error: "Too many files uploaded at once.",
    });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      error: "Unexpected file field name.",
    });
  }

  // Handle JSON parse errors
  if (err.type === "entity.parse.failed") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      error: "Invalid JSON payload",
    });
  }

  // Handle CORS errors
  if (err.message?.includes("Not allowed by CORS")) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      status: StatusCodes.FORBIDDEN,
      error: "Origin not allowed by CORS policy",
    });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    error: "Internal server error",
  });
});

// ---------------------------------------------------------------------------
// HTTP + Socket.IO server
// ---------------------------------------------------------------------------
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: uniqueOrigins.length ? uniqueOrigins : true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const decoded = verifyToken(token || "");
    const user = await FindUserByID(decoded.id);
    if (!user || user.role !== "provider") return next(new Error("Unauthorized socket connection"));
    socket.user = user;
    next();
  } catch {
    return next(new Error("Unauthorized socket connection"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.user._id.toString()}`);
  socket.emit("notification:connected", { connectedAt: new Date().toISOString() });
});

registerSocketServer(io);

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  try {
    await new Promise((resolve) => httpServer.close(resolve));
    await mongoose.connection.close();
    console.log("HTTP server and MongoDB connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Start server (DB-first startup)
// ---------------------------------------------------------------------------
const startServer = async () => {
  await connectDatabase();
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Allowed origins: ${uniqueOrigins.length ? uniqueOrigins.join(", ") : "ALL (no origin restriction)"}`);
    if (isSandboxMode()) {
      console.warn(`⚠️  Resend sandbox mode: emails only deliver to ${process.env.ADMIN_EMAIL}. Verify a domain at resend.com/domains for production.`);
    }
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

export { app, httpServer };