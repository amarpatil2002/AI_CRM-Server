import { Router } from "express";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/authorizeMiddlware.js";
import {
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getPermissions,
} from "./roleController.js";

const router = Router();

router.get("/permission", protect, getPermissions);
router.get("/", protect, authorize("role:read"), getRoles);
router.post("/", protect, authorize("role:create"), createRole);
router.get("/:roleId", protect, authorize("role:read"), getRoleById);
router.patch("/:roleId", protect, authorize("role:update"), updateRole);
router.delete("/:roleId", protect, authorize("role:delete"), deleteRole);

export default router;
