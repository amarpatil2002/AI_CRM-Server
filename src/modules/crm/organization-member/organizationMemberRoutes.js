import { Router } from "express";
import { protect } from "../../../middlewares/authMiddleware.js";
import { authorize } from "../../../middlewares/authorizeMiddleware.js";
import {
  listOrganizationMembers,
  inviteOrganizationMember,
  createOrganizationMember,
  getOrganizationMemberById,
  updateOrganizationMember,
  updateOrganizationMemberRoles,
  updateOrganizationMemberStatus,
  deleteOrganizationMember,
} from "./organizationMemberController.js";

const router = Router();

router.get("/", protect, authorize("user:read"), listOrganizationMembers);

router.post(
  "/invite",
  protect,
  authorize("user:invite"),
  inviteOrganizationMember,
);

router.post("/", protect, authorize("user:create"), createOrganizationMember);

router.get(
  "/:memberId",
  protect,
  authorize("user:read"),
  getOrganizationMemberById,
);

router.patch(
  "/:memberId",
  protect,
  authorize("user:update"),
  updateOrganizationMember,
);

router.patch(
  "/:memberId/roles",
  protect,
  authorize("role:update"),
  updateOrganizationMemberRoles,
);

router.patch(
  "/:memberId/status",
  protect,
  authorize("user:suspend"),
  updateOrganizationMemberStatus,
);

router.delete(
  "/:memberId",
  protect,
  authorize("user:delete"),
  deleteOrganizationMember,
);

export default router;
