import { Router } from "express";
import { protect } from "../../../middleware/authMiddleware.js";
import { authorize } from "../../../middleware/authorizeMiddlware.js";
import validate from "../../../middleware/validateMiddleware.js";

import {
  listOrganizationMembers,
  inviteOrganizationMember,
  createOrganizationMember,
  getOrganizationMemberById,
  updateOrganizationMember,
  updateOrganizationMemberRoles,
  updateOrganizationMemberStatus,
  deleteOrganizationMember,
  resendOrganizationMemberInvite,
} from "./memberController.js";

import {
  listOrganizationMembersSchema,
  inviteOrganizationMemberSchema,
  createOrganizationMemberSchema,
  getOrganizationMemberByIdSchema,
  updateOrganizationMemberSchema,
  updateOrganizationMemberRolesSchema,
  updateOrganizationMemberStatusSchema,
  deleteOrganizationMemberSchema,
  resendOrganizationMemberInviteSchema,
} from "./memberValidation.js";

const router = Router();

router.get(
  "/",
  protect,
  authorize("user:read"),
  validate(listOrganizationMembersSchema),
  listOrganizationMembers,
);

router.post(
  "/invite",
  protect,
  authorize("user:invite"),
  validate(inviteOrganizationMemberSchema),
  inviteOrganizationMember,
);

router.post(
  "/:memberId/resend-invite",
  protect,
  authorize("user:invite"),
  validate(resendOrganizationMemberInviteSchema),
  resendOrganizationMemberInvite,
);

// 2nd way to create a member is by using the invite endpoint, so we can disable this endpoint for now
// router.post(
//   "/",
//   protect,
//   authorize("user:create"),
//   validate(createOrganizationMemberSchema),
//   createOrganizationMember,
// );

router.get(
  "/:memberId",
  protect,
  authorize("user:read"),
  validate(getOrganizationMemberByIdSchema),
  getOrganizationMemberById,
);

router.patch(
  "/:memberId",
  protect,
  authorize("user:update"),
  validate(updateOrganizationMemberSchema),
  updateOrganizationMember,
);

router.patch(
  "/:memberId/roles",
  protect,
  authorize("role:update"),
  validate(updateOrganizationMemberRolesSchema),
  updateOrganizationMemberRoles,
);

router.patch(
  "/:memberId/status",
  protect,
  authorize("user:suspend"),
  validate(updateOrganizationMemberStatusSchema),
  updateOrganizationMemberStatus,
);

router.delete(
  "/:memberId",
  protect,
  authorize("user:delete"),
  validate(deleteOrganizationMemberSchema),
  deleteOrganizationMember,
);

export default router;
