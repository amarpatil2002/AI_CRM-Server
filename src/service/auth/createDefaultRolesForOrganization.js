import Role from "../../models/roleModel.js";
import Permission from "../../models/permissionModel.js";
import ApiError from "../../utils/ApiError.js";
import {
  DEFAULT_ROLE_DEFINITIONS,
  SYSTEM_ROLE_NAMES,
} from "../../utils/defaultRoles.js";

const toRoleCode = (roleName) => {
  return String(roleName).trim().toLowerCase().replace(/\s+/g, "_");
};

export const createDefaultRolesForOrganization = async ({
  organizationId,
  actorUserId = null,
  session = null,
}) => {
  if (!organizationId) {
    throw new ApiError(
      400,
      "Organization id is required to create default roles",
    );
  }

  const roleNames = Object.keys(DEFAULT_ROLE_DEFINITIONS);

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
  })
    .select("_id key")
    .session(session);

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

  const rolesToCreate = roleNames.map((roleName, index) => {
    const roleConfig = DEFAULT_ROLE_DEFINITIONS[roleName];

    return {
      organization: organizationId,
      name: roleName,
      code: toRoleCode(roleName),
      description: roleConfig.description,
      permissions: roleConfig.permissions.map((key) => permissionMap.get(key)),
      accessScope: roleConfig.accessScope,
      isSystem: true,
      isDefault: roleName === SYSTEM_ROLE_NAMES.OWNER,
      priority: 100 - index,
      status: "ACTIVE",
      createdBy: actorUserId,
      updatedBy: actorUserId,
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

export default createDefaultRolesForOrganization;
