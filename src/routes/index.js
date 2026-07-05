import express from "express";
import publicRoutes from "./publicRoutes.js";
import crmRoutes from "./crmRoutes.js";

const router = express.Router();

router.use("/public", publicRoutes);
router.use("/crm", crmRoutes);

export default router;
