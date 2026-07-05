import express from "express";
import organizationRoutes from "../modules/crm/organization/organizationRoutes.js";
import organizationMemberRoutes from "../modules/crm/organization-member/memberRoutes.js";

const router = express.Router();

router.use("/organization", organizationRoutes);
router.use("/organization-member", organizationMemberRoutes);

export default router;
