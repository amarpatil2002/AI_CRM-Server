import Role from "../../../models/roleModel.js";
import Permission from "../../../models/permissionModel.js";
import OrganizationMember from "../../../models/organizationMemberModel.js";
import ApiError from "../../../utils/apiError.js";
import {
  DEFAULT_ACCESS_SCOPE,
  MEMBER_STATUS,
  ROLE_STATUS,
  SYSTEM_ROLE_CODES,
} from "./roleConstant.js";
import {
  normalizeRoleListQuery,
  validateCreateRolePayload,
  validateObjectId,
  validateUpdateRolePayload,
} from "./roleValidation.js";
import { PERMISSIONS } from "../../../utils/permission.js";

/* -------------------------------------------------------
 * helpers
 * ----------------------------------------------------- */

const buildRoleListFilter = ({ organizationId, query }) => {
  const filter = {
    isDeleted: false,
    $or: [
      { organization: organizationId }, // org custom roles
      { organization: null, isSystem: true }, // global system roles
    ],
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.isSystem !== null) {
    filter.isSystem = query.isSystem;
  }

  if (query.isDefault !== null) {
    filter.isDefault = query.isDefault;
  }

  if (query.search) {
    const regex = new RegExp(query.search, "i");

    filter.$and = [
      {
        $or: [{ name: regex }, { code: regex }, { description: regex }],
      },
    ];
  }

  return filter;
};

const getActiveOrganizationMember = async ({ organizationId, userId }) => {
  const member = await OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
    status: MEMBER_STATUS.ACTIVE,
    isDeleted: false,
  }).lean();

  if (!member) {
    throw new ApiError(
      403,
      "You are not an active member of this organization",
    );
  }

  return member;
};

const getRoleByIdForOrganization = async ({ roleId, organizationId }) => {
  validateObjectId(roleId, "roleId");

  const role = await Role.findOne({
    _id: roleId,
    isDeleted: false,
    $or: [
      { organization: organizationId },
      { organization: null, isSystem: true },
    ],
  })
    .select(
      "_id name code description organization permissions accessScope isSystem isDefault priority status createdAt updatedAt",
    )
    .populate("permissions", "_id key module action")
    .lean();

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  const permissionKeys = Array.isArray(role.permissions)
    ? role.permissions.map((permission) => permission.key)
    : [];

  return {
    _id: role._id,
    name: role.name,
    code: role.code,
    description: role.description,
    organization: role.organization,
    isSystem: role.isSystem,
    isDefault: role.isDefault,
    status: role.status,
    priority: role.priority,
    accessScope: role.accessScope,
    // permissions: role.permissions,
    permissionKeys,
    permissionCount: role.permissions.length,
    meta: {
      canEdit: !role.isSystem,
      canDelete: !role.isSystem,
    },
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};

const ensureRoleNameAndCodeUnique = async ({
  organizationId,
  name,
  code,
  excludeRoleId = null,
}) => {
  const filter = {
    organization: organizationId,
    isDeleted: false,
    $or: [{ name }, { code }],
  };

  if (excludeRoleId) {
    filter._id = { $ne: excludeRoleId };
  }

  const existingRole = await Role.findOne(filter).lean();

  if (!existingRole) return;

  if (existingRole.name === name) {
    throw new ApiError(409, "Role name already exists");
  }

  if (existingRole.code === code) {
    throw new ApiError(409, "Role code already exists");
  }

  throw new ApiError(409, "Role already exists");
};

const ensureRoleCanBeModified = (role) => {
  if (!role || role.isDeleted) {
    throw new ApiError(404, "Role not found");
  }

  if (role.isSystem || role.code === SYSTEM_ROLE_CODES.OWNER) {
    throw new ApiError(403, "System roles cannot be modified");
  }
};

const ensureRoleCanBeDeleted = async ({ role, organizationId }) => {
  if (!role || role.isDeleted) {
    throw new ApiError(404, "Role not found");
  }

  if (role.isSystem || role.code === SYSTEM_ROLE_CODES.OWNER) {
    throw new ApiError(403, "System roles cannot be deleted");
  }

  const assignedCount = await OrganizationMember.countDocuments({
    organization: organizationId,
    role: role._id,
    status: { $in: [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.INVITED] },
    isDeleted: false,
  });

  if (assignedCount > 0) {
    throw new ApiError(
      409,
      "Cannot delete role because it is assigned to organization members",
    );
  }
};

const getPermissionDocsByKeys = async (permissionKeys = []) => {
  const uniqueKeys = [...new Set(permissionKeys)];

  if (!uniqueKeys.length) {
    throw new ApiError(400, "At least one permission is required");
  }

  const permissions = await Permission.find({
    key: { $in: uniqueKeys },
    isActive: true,
  })
    .select("_id key module action")
    .lean();

  if (permissions.length !== uniqueKeys.length) {
    const foundKeys = new Set(permissions.map((permission) => permission.key));

    const invalidKeys = uniqueKeys.filter((key) => !foundKeys.has(key));

    throw new ApiError(
      400,
      `Invalid or inactive permissions: ${invalidKeys.join(", ")}`,
    );
  }

  return permissions;
};

/* -------------------------------------------------------
 * services
 * ----------------------------------------------------- */

/**
 * GET ROLES
 */

export const getRolesService = async ({
  organizationId,
  query,
  currentUserPermissions,
}) => {
  console.log(query);
  const normalizedQuery = normalizeRoleListQuery(query);

  console.log(normalizedQuery);

  const filter = buildRoleListFilter({
    organizationId,
    query: normalizedQuery,
  });

  const sort = {
    [normalizedQuery.sortBy]: normalizedQuery.sortOrder,
    _id: -1,
  };

  const [roles, total] = await Promise.all([
    Role.find(filter)
      .select(
        "_id name code description isSystem isDefault priority status accessScope permissions createdAt updatedAt",
      )
      .sort(sort)
      .skip(normalizedQuery.skip)
      .limit(normalizedQuery.limit)
      .lean(),

    Role.countDocuments(filter),
  ]);

  const items = roles.map((role) => ({
    _id: role._id,

    name: role.name,

    code: role.code,

    description: role.description,

    isSystem: role.isSystem,

    isDefault: role.isDefault,

    priority: role.priority,

    status: role.status,

    accessScope: role.accessScope,

    permissionCount: Array.isArray(role.permissions)
      ? role.permissions.length
      : 0,

    createdAt: role.createdAt,

    updatedAt: role.updatedAt,

    meta: {
      canView: true,
      canEdit: currentUserPermissions.includes("role:update") && !role.isSystem,
      canDelete:
        currentUserPermissions.includes("role:delete") && !role.isSystem,
    },
  }));

  return {
    items,

    permissions: {
      canCreateRole: currentUserPermissions.includes(PERMISSIONS.ROLE_CREATE),

      canUpdateRole: currentUserPermissions.includes(PERMISSIONS.ROLE_UPDATE),

      canDeleteRole: currentUserPermissions.includes(PERMISSIONS.ROLE_DELETE),

      canReadPermissions: currentUserPermissions.includes(
        PERMISSIONS.PERMISSION_READ,
      ),

      canInviteUser: currentUserPermissions.includes(PERMISSIONS.USER_INVITE),

      canCreateUser: currentUserPermissions.includes(PERMISSIONS.USER_CREATE),

      canUpdateUser: currentUserPermissions.includes(PERMISSIONS.USER_UPDATE),

      canDeleteUser: currentUserPermissions.includes(PERMISSIONS.USER_DELETE),

      canSuspendUser: currentUserPermissions.includes(PERMISSIONS.USER_SUSPEND),
    },

    pagination: {
      page: normalizedQuery.page,

      limit: normalizedQuery.limit,

      total,

      totalPages: Math.ceil(total / normalizedQuery.limit),

      hasNextPage: normalizedQuery.page * normalizedQuery.limit < total,

      hasPrevPage: normalizedQuery.page > 1,
    },
  };
};

export const getPermissionsService = async () => {
  const permissions = await Permission.find({ isActive: true })
    .select("_id key module action description")
    .sort({ module: 1, action: 1 })
    .lean();

  const grouped = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }

    acc[permission.module].push({
      _id: permission._id,
      key: permission.key,
      action: permission.action,
      description: permission.description,
    });

    return acc;
  }, {});

  return {
    items: permissions,
    grouped,
  };
};

/**
 * GET ROLE BY ID
 */
export const getRoleByIdService = async ({ roleId, organizationId }) => {
  return getRoleByIdForOrganization({
    roleId,
    organizationId,
  });
};

/**
 * CREATE ROLE
 */
export const createRoleService = async ({
  currentUserId,
  organizationId,
  payload,
}) => {
  const { name, code, description, permissionKeys, accessScope, priority } =
    validateCreateRolePayload(payload);

  // make sure current user belongs to org
  await getActiveOrganizationMember({
    organizationId,
    userId: currentUserId,
  });

  // unique name / code check
  await ensureRoleNameAndCodeUnique({
    organizationId,
    name,
    code,
  });

  // get permission documents
  const permissionDocs = await getPermissionDocsByKeys(permissionKeys);

  // create role
  const role = await Role.create({
    organization: organizationId,
    name,
    code,
    description,
    permissions: permissionDocs.map((permission) => permission._id),
    accessScope,
    isSystem: false,
    isDefault: false,
    priority,
    status: ROLE_STATUS.ACTIVE,
    createdBy: currentUserId,
    updatedBy: currentUserId,
  });

  return getRoleByIdForOrganization({
    roleId: role._id,
    organizationId,
  });
};

/**
 * UPDATE ROLE
 */
export const updateRoleService = async ({
  roleId,
  currentUserId,
  organizationId,
  payload,
}) => {
  validateObjectId(roleId, "roleId");

  const update = validateUpdateRolePayload(payload);

  // make sure current user belongs to org
  await getActiveOrganizationMember({
    organizationId,
    userId: currentUserId,
  });

  // find role
  const role = await Role.findOne({
    _id: roleId,
    $or: [
      { organization: organizationId },
      { organization: null, isSystem: true },
    ],
    isDeleted: false,
  });

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  ensureRoleCanBeModified(role);

  // name/code uniqueness if changing
  const nextName = "name" in update ? update.name : role.name;
  const nextCode = "code" in update ? update.code : role.code;

  if (nextName !== role.name || nextCode !== role.code) {
    await ensureRoleNameAndCodeUnique({
      organizationId,
      name: nextName,
      code: nextCode,
      excludeRoleId: role._id,
    });
  }

  // update primitive fields
  if ("name" in update) {
    role.name = update.name;
  }

  if ("code" in update) {
    role.code = update.code;
  }

  if ("description" in update) {
    role.description = update.description;
  }

  if ("priority" in update) {
    role.priority = update.priority;
  }

  if ("status" in update) {
    role.status = update.status;
  }

  // update permissions
  if ("permissionKeys" in update) {
    const permissionDocs = await getPermissionDocsByKeys(update.permissionKeys);
    role.permissions = permissionDocs.map((permission) => permission._id);
  }

  // update access scope
  if ("accessScope" in update) {
    const currentScope =
      role.accessScope?.toObject?.() || role.accessScope || {};

    role.accessScope = {
      ...DEFAULT_ACCESS_SCOPE,
      ...currentScope,
      ...update.accessScope,
    };
  }

  role.updatedBy = currentUserId;
  await role.save();

  return getRoleByIdForOrganization({
    roleId: role._id,
    organizationId,
  });
};

/**
 * DELETE ROLE
 */
export const deleteRoleService = async ({
  roleId,
  currentUserId,
  organizationId,
}) => {
  validateObjectId(roleId, "roleId");

  // make sure current user belongs to org
  await getActiveOrganizationMember({
    organizationId,
    userId: currentUserId,
  });

  const role = await Role.findOne({
    _id: roleId,
    $or: [
      { organization: organizationId },
      { organization: null, isSystem: true },
    ],
    isDeleted: false,
  });

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  await ensureRoleCanBeDeleted({
    role,
    organizationId,
  });

  role.isDeleted = true;
  role.deletedAt = new Date();
  role.status = ROLE_STATUS.INACTIVE;
  role.updatedBy = currentUserId;

  await role.save();

  return {
    message: "Role deleted successfully",
    deletedRoleId: role._id,
  };
};
