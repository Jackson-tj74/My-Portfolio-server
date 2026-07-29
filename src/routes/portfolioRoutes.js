import express from "express";
import multiparty from "connect-multiparty";
import { verifyAccessToken } from "../middlewares/authMiddlewares.js";
import { normalizePortfolioMultipart } from "../middlewares/requestMiddlewares.js";
import { uploadService } from "../services/uploadService.js";
import portfolioControllers from "../modules/portfolio/portfolioControllers.js";
import settingsControllers from "../modules/portfolio/settingsControllers.js";

const router = express.Router();
const multipart = multiparty();
router.get("/settings", settingsControllers.publicSettings);
router.get("/admin-settings", verifyAccessToken(["provider"]), settingsControllers.adminSettings);
router.put("/admin-settings/:key", verifyAccessToken(["provider"]), multipart, uploadService, settingsControllers.updateSetting);
router.get("/admin/:kind", verifyAccessToken(["provider"]), portfolioControllers.listAdmin);
router.post("/admin/:kind", verifyAccessToken(["provider"]), multipart, uploadService, normalizePortfolioMultipart, portfolioControllers.create);
router.patch("/admin/:kind/:id", verifyAccessToken(["provider"]), multipart, uploadService, normalizePortfolioMultipart, portfolioControllers.update);
router.delete("/admin/:kind/:id", verifyAccessToken(["provider"]), portfolioControllers.remove);
router.get("/:kind/:id", portfolioControllers.get);
router.get("/:kind", portfolioControllers.listPublic);

export default router;
