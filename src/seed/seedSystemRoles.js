import Role from "../models/roleModel.js";
import Permission from "../models/permissionModel.js";
import ApiError from "../utils/ApiError.js";
import { DEFAULT_ROLE_DEFINITIONS } from "../utils/defaultRoles.js";
import { SYSTEM_ROLE_NAMES } from "../utils/defaultRoles.js";

const toRoleCode = (roleName) => {
  return String(roleName).trim().toLowerCase().replace(/\s+/g, "_");
};

export const seedSystemRoles = async () => {
  const roleNames = Object.keys(DEFAULT_ROLE_DEFINITIONS);

  const permissionKeys = [
    ...new Set(
      roleNames.flatMap(
        (roleName) => DEFAULT_ROLE_DEFINITIONS[roleName].permissions,
      ),
    ),
  ];

  const permissions = await Permission.find({
    key: { $in: permissionKeys },
    isActive: true,
  }).select("_id key");

  const permissionMap = new Map(
    permissions.map((permission) => [permission.key, permission._id]),
  );

  const missingPermissions = permissionKeys.filter(
    (key) => !permissionMap.has(key),
  );

  if (missingPermissions.length > 0) {
    throw new ApiError(
      500,
      `Missing permission seeds: ${missingPermissions.join(", ")}`,
    );
  }

  for (const roleName of roleNames) {
    const config = DEFAULT_ROLE_DEFINITIONS[roleName];

    await Role.updateOne(
      {
        organization: null,
        code: toRoleCode(roleName),
      },
      {
        $set: {
          organization: null,
          name: roleName,
          code: toRoleCode(roleName),
          description: config.description,
          permissions: config.permissions.map((key) => permissionMap.get(key)),
          accessScope: config.accessScope,
          isSystem: true,
          isDefault: roleName === SYSTEM_ROLE_NAMES.OWNER,
          status: "ACTIVE",
          isDeleted: false,
          deletedAt: null,
        },
      },
      { upsert: true },
    );
  }

  return {
    count: roleNames.length,
    roleNames,
  };
};

export default seedSystemRoles;
