import Role from "../models/roleModel.js";
import Permission from "../models/permissionModel.js";
import ApiError from "../utils/apiError.js";
import {
  DEFAULT_ROLE_DEFINITIONS,
  SYSTEM_ROLE_NAMES,
} from "../utils/defaultRoles.js";

export const createDefaultRolesForOrganization = async (
  organizationId,
  session = null,
) => {
  if (!organizationId) {
    throw new ApiError(
      400,
      "Organization id is required to create default roles",
    );
  }

  const roleNames = Object.keys(DEFAULT_ROLE_DEFINITIONS);

  // Get all permission keys used by all roles
  const requiredPermissionKeys = [
    ...new Set(
      roleNames.flatMap(
        (roleName) => DEFAULT_ROLE_DEFINITIONS[roleName].permissions,
      ),
    ),
  ];

  const permissions = await Permission.find({
    key: { $in: requiredPermissionKeys },
    isActive: true,
  }).select("_id key");

  const permissionMap = new Map(
    permissions.map((permission) => [permission.key, permission._id]),
  );

  const missingPermissions = requiredPermissionKeys.filter(
    (key) => !permissionMap.has(key),
  );

  if (missingPermissions.length > 0) {
    throw new ApiError(
      500,
      `Missing permission seeds: ${missingPermissions.join(", ")}`,
    );
  }

  const rolesToCreate = roleNames.map((roleName) => {
    const roleConfig = DEFAULT_ROLE_DEFINITIONS[roleName];

    return {
      organizationId,
      name: roleName,
      description: roleConfig.description,
      permissions: roleConfig.permissions.map((key) => permissionMap.get(key)),
      accessScope: roleConfig.accessScope,
      isSystem: true,
      isActive: true,
    };
  });

  const createdRoles = await Role.insertMany(rolesToCreate, {
    session,
    ordered: true,
  });

  const roleMap = createdRoles.reduce((acc, role) => {
    acc[role.name] = role;
    return acc;
  }, {});

  return {
    roles: createdRoles,
    roleMap,
    ownerRole: roleMap[SYSTEM_ROLE_NAMES.OWNER],
    adminRole: roleMap[SYSTEM_ROLE_NAMES.ADMIN],
    managerRole: roleMap[SYSTEM_ROLE_NAMES.MANAGER],
    salesRepRole: roleMap[SYSTEM_ROLE_NAMES.SALES_REP],
  };
};
