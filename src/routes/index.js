/** @format */

import express from "express";
import router from "./authRoutes.js";
import portfolioRouter from "./portfolioRoutes.js";
import notificationRouter from "./notificationRoutes.js";
import aiRouter from "./aiRoutes.js";
import emailRouter from "./emailRoutes.js";

const routers = express.Router();

routers.use("/auth", router);
routers.use("/content", portfolioRouter);
routers.use("/notifications", notificationRouter);
routers.use("/ai", aiRouter);
routers.use("/email", emailRouter);


export default routers;
