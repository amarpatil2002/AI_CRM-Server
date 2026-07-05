import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/authorize.middleware.js";
import {
  getPermissions,
  getGroupedPermissions,
} from "./permission.controller.js";

const router = Router();

router.get("/", protect, authorize("permission:read"), getPermissions);
router.get(
  "/grouped",
  protect,
  authorize("permission:read"),
  getGroupedPermissions,
);

export default router;
