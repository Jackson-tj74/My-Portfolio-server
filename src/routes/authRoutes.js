import express from "express";
import multiparty from "connect-multiparty";
import { routeBodyValidation } from "../middlewares/requestMiddlewares.js";
import { contactSchema, signinSchema, signupSchema } from "../validations/authValidations.js";
import { replySchema } from "../validations/emailValidations.js";
import { verifyAccessToken } from "../middlewares/authMiddlewares.js";
import authControllers from "../modules/auth/authControllers.js";
import { uploadService } from "../services/uploadService.js";
import { createRateLimiter } from "../middlewares/securityMiddlewares.js";
import { handleError } from "../utils/responseUtils.js";
import { StatusCodes } from "http-status-codes";

const multipart = multiparty();
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many authentication attempts" });
const contactRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many contact submissions" });
const providerSetupOnly = (req, res, next) => {
  const configuredKey = process.env.PROVIDER_SETUP_KEY;
  const requestKey = req.get("x-provider-setup-key");
  if (!configuredKey || requestKey !== configuredKey) return handleError(res, StatusCodes.NOT_FOUND, "Route not found");
  return next();
};

const router = express.Router();
router.post(
  "/login",
  authRateLimiter,
  routeBodyValidation(signinSchema),
  
  authControllers.login,
);
router.post(
  "/signup",
  authRateLimiter,
  providerSetupOnly,
  routeBodyValidation(signupSchema),
  
  authControllers.signup
  
);
router.post(
  "/contact",
  contactRateLimiter,
  routeBodyValidation(contactSchema),
  authControllers.message
  
);

router.get(
  "/get-contacts",
  verifyAccessToken("provider"),
  authControllers.findMessages
  
);


router.delete(
  "/delete-contact/:id",
  verifyAccessToken("provider"),
  authControllers.deleteMessage
  
);

router.get("/dashboard-stats", verifyAccessToken("provider"), authControllers.getDashboardStats);
router.patch("/contact/:id/status", verifyAccessToken("provider"), authControllers.updateMessageStatus);
router.post("/contact/:id/reply", verifyAccessToken("provider"), routeBodyValidation(replySchema), authControllers.replyToMessage);

router.post("/logout", verifyAccessToken("provider"),authControllers.logout);
router.get("/profile", verifyAccessToken("provider"), authControllers.getProfile);
router.patch("/edit-profile",verifyAccessToken("provider"), multipart, uploadService,authControllers.updateProfile);
router.delete("/delete-account", verifyAccessToken("provider"),authControllers.deleteAccount);




export default router;
