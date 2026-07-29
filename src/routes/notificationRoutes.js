import express from "express";
import { verifyAccessToken } from "../middlewares/authMiddlewares.js";
import notificationControllers from "../modules/notifications/notificationControllers.js";

const router = express.Router();
router.use(verifyAccessToken(["provider"]));
router.get("/", notificationControllers.list);
router.patch("/read-all", notificationControllers.markAllRead);
router.patch("/:id/read", notificationControllers.markRead);
router.delete("/:id", notificationControllers.remove);
export default router;
