import express from "express";
import organizationRoutes from "../modules/crm/organization/organizationRoutes.js";
import organizationMemberRoutes from "../modules/crm/organization-member/memberRoutes.js";
import roleRoutes from "../modules/crm/role/roleRoutes.js";
import profileRoutes from "../modules/crm/profile/profileRoutes.js";

const router = express.Router();

router.use("/organization", organizationRoutes);
router.use("/organization-member", organizationMemberRoutes);
router.use("/profile", profileRoutes);
router.use("/role", roleRoutes);

export default router;
