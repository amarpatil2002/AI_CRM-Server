import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/authorize.middleware.js";
import {
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
} from "./role.controller.js";

const router = Router();

router.get("/", protect, authorize("role:read"), getRoles);
router.post("/", protect, authorize("role:create"), createRole);
router.get("/:roleId", protect, authorize("role:read"), getRoleById);
router.patch("/:roleId", protect, authorize("role:update"), updateRole);
router.delete("/:roleId", protect, authorize("role:delete"), deleteRole);

export default router;
