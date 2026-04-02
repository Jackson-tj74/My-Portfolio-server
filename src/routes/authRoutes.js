import express from "express";

import { routeBodyValidation } from "../middlewares/requestMiddlewares.js";
import { contactSchema, signinSchema, signupSchema } from "../validations/authValidations.js";

import authControllers from "../modules/auth/authControllers.js";

const router = express.Router();
router.post(
  "/login",
  routeBodyValidation(signinSchema),
  
  authControllers.login,
);
router.post(
  "/signup",
  routeBodyValidation(signupSchema),
  
  authControllers.signup
  
);
router.post(
  "/contact",
  routeBodyValidation(contactSchema),
  authControllers.message
  
);




export default router;
