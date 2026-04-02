/** @format */

import express from "express";
import router from "./authRoutes.js";

const routers = express.Router();

routers.use("/auth", router);


export default routers;