import Permission from "../models/permissionModel.js";
import { ALL_PERMISSIONS } from "../utils/permission.js";

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

export const seedPermissions = async () => {
  const permissionDocs = ALL_PERMISSIONS.map(buildPermissionDoc);

  for (const permission of permissionDocs) {
    await Permission.updateOne(
      { key: permission.key },
      {
        $set: {
          key: permission.key,
          module: permission.module,
          action: permission.action,
          description: permission.description,
          isActive: true,
        },
      },
      { upsert: true },
    );
  }

  return {
    count: permissionDocs.length,
  };
};

export default seedPermissions;
