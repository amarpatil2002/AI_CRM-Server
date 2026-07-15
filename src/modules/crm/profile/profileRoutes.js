import { Router } from "express";
import profileController from "./profileController.js";
import { protect } from "../../../middleware/authMiddleware.js";
// import upload from "../../middlewares/upload.middleware.js";
import validate from "../../../middleware/validateMiddleware.js";
import { updateProfileSchema } from "./profileValidation.js";

const router = Router();

router.get("/me", protect, profileController.getProfile);

router.patch(
  "/me",
  protect,
  validate(updateProfileSchema),
  profileController.updateProfile,
);

// router.put(
//   "/avatar",
//   protect,
//   upload.single("avatar"),
//   profileController.uploadAvatar,
// );

export default router;
