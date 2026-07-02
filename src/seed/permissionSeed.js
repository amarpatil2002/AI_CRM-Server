import mongoose from "mongoose";
import Permission from "../models/permission.model.js";
import { PERMISSION_GROUPS } from "../utils/permissions.js";
import dotenv from "dotenv";

dotenv.config();

const flattenPermissions = () => {
  const rows = [];

  Object.entries(PERMISSION_GROUPS).forEach(([moduleName, permissions]) => {
    permissions.forEach((permissionKey) => {
      const action = permissionKey.split(".").slice(1).join(".");

      rows.push({
        key: permissionKey,
        module: moduleName,
        action,
        description: `${permissionKey} permission`,
        isActive: true,
      });
    });
  });

  return rows;
};

const seedPermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const permissions = flattenPermissions();

    for (const permission of permissions) {
      await Permission.updateOne(
        { key: permission.key },
        { $set: permission },
        { upsert: true },
      );
    }

    console.log("Permissions seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Permission seed failed:", error);
    process.exit(1);
  }
};

seedPermissions();
