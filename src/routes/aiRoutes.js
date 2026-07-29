import express from "express";
import { verifyAccessToken } from "../middlewares/authMiddlewares.js";
import { createRateLimiter } from "../middlewares/securityMiddlewares.js";
import aiControllers from "../modules/ai/aiControllers.js";

const router = express.Router();
router.get("/config", aiControllers.config);
router.post("/chat", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30, message: "Too many AI requests" }), aiControllers.chat);
router.post("/feedback", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: "Too many feedback requests" }), aiControllers.feedback);
router.get("/history/:sessionId", aiControllers.history);
router.delete("/history/:sessionId", aiControllers.clear);
router.get("/analytics", verifyAccessToken(["provider"]), aiControllers.analytics);
export default router;
