import { Router } from "express";
import * as authController from "./authController.js";
import validate from "../../../middleware/validateMiddleware.js";
import { protect } from "../../../middleware/authMiddleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./authValidation.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", protect, authController.getMe);

router.post("/logout", protect, authController.logout);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  authController.changePassword,
);

export default router;
