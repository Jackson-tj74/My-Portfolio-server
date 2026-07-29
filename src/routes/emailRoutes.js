import express from "express";
import { routeBodyValidation } from "../middlewares/requestMiddlewares.js";
import { createRateLimiter } from "../middlewares/securityMiddlewares.js";
import { newsletterSchema } from "../validations/emailValidations.js";
import emailControllers from "../modules/email/emailControllers.js";

const router = express.Router();
router.get("/transport-status", emailControllers.transportStatus);
router.post("/newsletter/subscribe", createRateLimiter({ max: 10, message: "Too many subscription requests" }), routeBodyValidation(newsletterSchema), emailControllers.subscribe);
export default router;
