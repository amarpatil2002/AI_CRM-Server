import mongoose from "mongoose";
import Permission from "../models/permissionModel.js";
import { ALL_PERMISSIONS } from "../utils/permission.js";
import connectDB from "../config/db.js";

const buildPermissionDoc = (key) => {
  const [module, action] = key.split(":");

  return {
    key,
    module,
    action,
    description: `${action} permission for ${module}`,
    isActive: true,
  };
};

const seedPermissions = async () => {
  try {
    await connectDB();

    const permissionDocs = ALL_PERMISSIONS.map(buildPermissionDoc);

    for (const permission of permissionDocs) {
      await Permission.updateOne(
        { key: permission.key },
        { $set: permission },
        { upsert: true },
      );
    }

    console.log(`Seeded ${permissionDocs.length} permissions successfully`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding permissions:", error);
    process.exit(1);
  }
};

seedPermissions();
