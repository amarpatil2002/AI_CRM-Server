import Role from "../models/roleModel.js";
import Permission from "../models/permissionModel.js";
import ApiError from "../utils/apiError.js";
import { DEFAULT_ROLE_DEFINITIONS } from "../utils/defaultRoles.js";
import { ROLE_STATUS } from "../modules/crm/role/roleConstant.js";

export const seedSystemRoles = async () => {
  const roleConfigs = Object.values(DEFAULT_ROLE_DEFINITIONS);

  if (!roleConfigs.length) {
    return {
      count: 0,
      roleCodes: [],
    };
  }

  // 1) Collect all permission keys used by all system roles
  const permissionKeys = [
    ...new Set(roleConfigs.flatMap((role) => role.permissions)),
  ];

  // 2) Load active permission docs
  const permissions = await Permission.find({
    key: { $in: permissionKeys },
    isActive: true,
  }).select("_id key");

  const permissionMap = new Map(
    permissions.map((permission) => [permission.key, permission._id]),
  );

  // 3) Ensure every permission key used by default roles exists in DB
  const missingPermissions = permissionKeys.filter(
    (key) => !permissionMap.has(key),
  );

  if (missingPermissions.length > 0) {
    throw new ApiError(
      500,
      `Missing permission seeds: ${missingPermissions.join(", ")}`,
    );
  }

  // 4) Upsert each system role
  for (const config of roleConfigs) {
    await Role.updateOne(
      {
        organization: null,
        code: config.code,
      },
      {
        $set: {
          organization: null,
          name: config.name,
          code: config.code,
          description: config.description ?? null,
          permissions: config.permissions.map((key) => permissionMap.get(key)),
          accessScope: config.accessScope,
          isSystem: true,
          isDefault: Boolean(config.isDefault),
          priority: config.priority ?? 0,
          status: ROLE_STATUS.ACTIVE,
          isDeleted: false,
          deletedAt: null,
          updatedBy: null,
        },
        $setOnInsert: {
          createdBy: null,
        },
      },
      {
        upsert: true,
      },
    );
  }

  return {
    count: roleConfigs.length,
    roleCodes: roleConfigs.map((role) => role.code),
  };
};

export default seedSystemRoles;
