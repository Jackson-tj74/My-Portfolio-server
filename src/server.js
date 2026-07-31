/** @format */

import express from 'express';
import { createServer } from 'node:http';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import StatusCodes from 'http-status-codes';

import './database/configs/config.js';
import router from './routes/index.js';
import { handleSuccess } from './utils/responseUtils.js';
import { createRateLimiter, rejectUnsafeKeys, requestId, securityHeaders } from './middlewares/securityMiddlewares.js';
import { verifyToken } from './utils/jwtUtils.js';
import { FindUserByID } from './modules/auth/authRepositories.js';
import { registerSocketServer } from './services/realtimeService.js';
import { isSandboxMode } from './services/sendEmail.js';

dotenv.config({ quiet: true });
const app = express();
const port = process.env.PORT;

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
const allowedOrigins = [process.env.CLIENT_URL, process.env.Link, ...configuredOrigins, ...developmentOrigins]
  .map(normalizeOrigin)
  .filter(Boolean);
app.set('trust proxy', 1);
app.use(requestId);
app.use(securityHeaders);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    // Reject silently; throwing here makes Express print a stack trace for
    // every browser request from an unregistered origin.
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));
app.use(rejectUnsafeKeys);
app.use(createRateLimiter({ max: 300, message: 'Too many API requests' }));

app.use("/api/v1",router)

app.use('/api/v1', (_req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({ success: false, status: StatusCodes.NOT_FOUND, message: 'API route not found' });
});

app.get(/.*/, (req, res) => {
  return handleSuccess(
    res,
    StatusCodes.OK,
    'WELCOME MY PORTFOLIO',
    {},
  );
});

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: allowedOrigins.length ? allowedOrigins : true, credentials: true },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const decoded = verifyToken(token || "");
    const user = await FindUserByID(decoded.id);
    if (!user || user.role !== "provider") return next(new Error("Unauthorized socket connection"));
    socket.user = user;
    next();
  } catch { next(new Error("Unauthorized socket connection")); }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.user._id.toString()}`);
  socket.emit("notification:connected", { connectedAt: new Date().toISOString() });
});
registerSocketServer(io);

httpServer.listen(port, () => {
  console.log(`Server running on ${port}`);
  if (isSandboxMode()) console.warn(`⚠️  Resend sandbox mode: emails only deliver to ${process.env.ADMIN_EMAIL}. Verify a domain at resend.com/domains for production.`);
});
