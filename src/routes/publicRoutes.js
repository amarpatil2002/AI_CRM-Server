import express from "express";
import authRoute from "../modules/public/auth/authRoutes.js";

const router = express.Router();

router.use("/auth", authRoute);

export default router;
