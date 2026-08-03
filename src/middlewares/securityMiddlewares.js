import { randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { handleError } from "../utils/responseUtils.js";

export const requestId = (req, res, next) => {
  const id = req.get("x-request-id") || randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);
  next();
};

export const securityHeaders = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-XSS-Protection", "0");
  next();
};

const hasUnsafeKey = (value) => {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) =>
    key.startsWith("$") || key.includes(".") || hasUnsafeKey(child),
  );
};

export const rejectUnsafeKeys = (req, res, next) => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return handleError(res, StatusCodes.BAD_REQUEST, "Unsafe input detected");
  }
  next();
};

export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests" } = {}) => {
  const clients = new Map();

  // Periodic cleanup of expired entries to prevent memory leaks
  const CLEANUP_INTERVAL = windowMs;
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of clients) {
      if (now - entry.startedAt >= windowMs) clients.delete(key);
    }
  };
  const cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL);
  cleanupTimer.unref?.();

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const current = clients.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      clients.set(key, { startedAt: now, count: 1 });
      return next();
    }
    current.count += 1;
    if (current.count > max) {
      res.setHeader("Retry-After", Math.ceil((windowMs - (now - current.startedAt)) / 1000));
      return handleError(res, StatusCodes.TOO_MANY_REQUESTS, message);
    }
    next();
  };
};