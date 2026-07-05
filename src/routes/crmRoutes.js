import express from "express";
import organizationRoutes from "../modules/crm/organization/organizationRoutes.js";

const router = express.Router();

router.use("/organization", organizationRoutes);

export default router;
