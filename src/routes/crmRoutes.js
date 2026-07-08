import express from "express";
import organizationRoutes from "../modules/crm/organization/organizationRoutes.js";
import organizationMemberRoutes from "../modules/crm/organization-member/memberRoutes.js";
import roleRoutes from "../modules/crm/role/roleRoutes.js";

const router = express.Router();

router.use("/organization", organizationRoutes);
router.use("/organization-member", organizationMemberRoutes);
router.use("/role", roleRoutes);

export default router;
