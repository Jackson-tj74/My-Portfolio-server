import express from "express";
import multiparty from "connect-multiparty";
import { routeBodyValidation } from "../middlewares/requestMiddlewares.js";
import { contactSchema, signinSchema, signupSchema } from "../validations/authValidations.js";
import { verifyAccessToken } from "../middlewares/authMiddlewares.js";
import authControllers from "../modules/auth/authControllers.js";
import { uploadService } from "../services/uploadService.js";

const multipart = multiparty();

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

router.get(
  "/get-contacts",
  authControllers.findMessages
  
);


router.delete(
  "/delete-contact/:id",
  authControllers.deleteMessage
  
);

router.post("/logout", verifyAccessToken("provider"),authControllers.logout);
router.get("/profile", verifyAccessToken("provider"), authControllers.getProfile);
router.patch("/edit-profile",verifyAccessToken("provider"), multipart, uploadService,authControllers.updateProfile);
router.delete("/delete-account", verifyAccessToken("provider"),authControllers.deleteAccount);




export default router;
