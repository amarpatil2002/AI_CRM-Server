import express from "express";
import publicRoutes from "./publicRoutes.js";

const router = express.Router();

router.use("/public", publicRoutes);

export default router;
