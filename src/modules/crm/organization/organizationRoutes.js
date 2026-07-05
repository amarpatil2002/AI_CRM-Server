import express from "express";
import {
  getMyOrganization,
  updateMyOrganization,
} from "./organizationController.js";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/authorizeMiddlware.js";
import { PERMISSIONS } from "../../../utils/permission.js";
import validate from "../../../middleware/validateMiddleware.js";
import { updateMyOrganizationSchema } from "./organizationValidation.js";

const router = express.Router();

router.get("/me", protect, authorize(PERMISSIONS.ORG_READ), getMyOrganization);

router.patch(
  "/me",
  protect,
  authorize(PERMISSIONS.ORG_UPDATE),
  validate(updateMyOrganizationSchema),
  updateMyOrganization,
);

export default router;
