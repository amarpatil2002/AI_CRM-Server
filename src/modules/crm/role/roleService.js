import Role from "../../../models/roleModel.js";
import Permission from "../../../models/permissionModel.js";
import OrganizationMember from "../../../models/organizationMemberModel.js";
import ApiError from "../../../utils/apiError.js";
import {
  DEFAULT_ACCESS_SCOPE,
  MEMBER_STATUS,
  ROLE_PERMISSION_KEYS,
  ROLE_STATUS,
  SYSTEM_ROLE_CODES,
} from "./roleConstant.js";
import {
  assertValidObjectIdArray,
  normalizeRoleListQuery,
  validateCreateRolePayload,
  validateObjectId,
  validateUpdateRolePayload,
} from "./roleValidation.js";

/**
 * --------------------------------------------------------
 * Helpers
 * --------------------------------------------------------
 */

const buildRoleListFilter = ({ organizationId, query }) => {
  const filter = {
    organization: organizationId,
    isDeleted: false,
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
    filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
  }

  return filter;
};

const getActiveMembershipOrThrow = async ({
  organizationId,
  userId,
  session = null,
}) => {
  const membership = await OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
    status: MEMBER_STATUS.ACTIVE,
    isDeleted: false,
  })
    .session(session)
    .lean();

  if (!membership) {
    throw new ApiError(
      403,
      "Active organization membership not found for current user",
    );
  }

  if (!Array.isArray(membership.roles) || membership.roles.length === 0) {
    throw new ApiError(403, "No roles assigned to current member");
  }

  return membership;
};

const getActiveRolesByIds = async ({
  organizationId,
  roleIds,
  session = null,
}) => {
  return Role.find({
    _id: { $in: roleIds },
    organization: organizationId,
    status: ROLE_STATUS.ACTIVE,
    isDeleted: false,
  })
    .populate({
      path: "permissions",
      match: { isActive: true },
      select: "_id key module action description isActive",
    })
    .session(session);
};

const getEffectivePermissionsForMember = async ({
  organizationId,
  roleIds,
  session = null,
}) => {
  const roles = await getActiveRolesByIds({
    organizationId,
    roleIds,
    session,
  });

  if (!roles.length) {
    throw new ApiError(403, "No active roles found for current member");
  }

  const permissionMap = new Map();

  for (const role of roles) {
    for (const permission of role.permissions || []) {
      if (!permission) continue;
      permissionMap.set(String(permission._id), permission);
    }
  }

  const permissions = Array.from(permissionMap.values());

  return {
    roles,
    permissions,
    permissionIdSet: new Set(
      permissions.map((permission) => String(permission._id)),
    ),
    permissionKeySet: new Set(permissions.map((permission) => permission.key)),
  };
};

const resolveRequestedPermissions = async ({
  permissionIds = [],
  permissionKeys = [],
  session = null,
}) => {
  let permissions = [];

  if (permissionIds.length) {
    assertValidObjectIdArray(permissionIds, "permissionIds");

    permissions = await Permission.find({
      _id: { $in: permissionIds },
      isActive: true,
    })
      .select("_id key module action description isActive")
      .session(session);
  } else if (permissionKeys.length) {
    permissions = await Permission.find({
      key: { $in: permissionKeys },
      isActive: true,
    })
      .select("_id key module action description isActive")
      .session(session);
  } else {
    throw new ApiError(
      400,
      "Either permissionIds or permissionKeys must be provided",
    );
  }

  const requestedCount = permissionIds.length || permissionKeys.length;

  if (!permissions.length || permissions.length !== requestedCount) {
    throw new ApiError(
      400,
      "Some requested permissions are invalid or inactive",
    );
  }

  return permissions;
};

const assertCreatorCanAssignPermissions = ({
  requestedPermissions,
  creatorPermissionIdSet,
  creatorPermissionKeySet,
}) => {
  const forbiddenPermissions = [];

  for (const permission of requestedPermissions) {
    const hasById = creatorPermissionIdSet.has(String(permission._id));
    const hasByKey = creatorPermissionKeySet.has(permission.key);

    if (!hasById && !hasByKey) {
      forbiddenPermissions.push(permission.key);
    }
  }

  if (forbiddenPermissions.length) {
    throw new ApiError(
      403,
      "You cannot assign permissions that you do not have",
      forbiddenPermissions,
    );
  }
};

const assertRoleBelongsToOrganization = (role, organizationId) => {
  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (String(role.organization) !== String(organizationId)) {
    throw new ApiError(404, "Role not found in this organization");
  }
};

const assertRoleUpdatable = (role) => {
  if (!role || role.isDeleted) {
    throw new ApiError(404, "Role not found");
  }

  if (role.isSystem || role.code === SYSTEM_ROLE_CODES.OWNER) {
    throw new ApiError(
      403,
      "System roles cannot be modified from this endpoint",
    );
  }
};

const assertRoleDeletable = async ({
  role,
  organizationId,
  session = null,
}) => {
  if (!role || role.isDeleted) {
    throw new ApiError(404, "Role not found");
  }

  if (role.isSystem || role.code === SYSTEM_ROLE_CODES.OWNER) {
    throw new ApiError(403, "System roles cannot be deleted");
  }

  const assignedCount = await OrganizationMember.countDocuments({
    organization: organizationId,
    roles: role._id,
    status: { $in: [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.INVITED] },
    isDeleted: false,
  }).session(session);

  if (assignedCount > 0) {
    throw new ApiError(
      409,
      "Cannot delete role because it is assigned to organization members",
    );
  }
};

const getRoleByIdForOrganization = async ({
  roleId,
  organizationId,
  session = null,
}) => {
  validateObjectId(roleId, "roleId");

  const role = await Role.findOne({
    _id: roleId,
    organization: organizationId,
    isDeleted: false,
  })
    .populate({
      path: "permissions",
      select: "_id key module action description isActive",
    })
    .populate("createdBy", "_id firstName lastName email")
    .populate("updatedBy", "_id firstName lastName email")
    .session(session);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
};

/**
 * --------------------------------------------------------
 * Services
 * --------------------------------------------------------
 */

export const getRolesService = async ({ organizationId, query }) => {
  const normalizedQuery = normalizeRoleListQuery(query);

  const filter = buildRoleListFilter({
    organizationId,
    query: normalizedQuery,
  });

  const sort = {
    [normalizedQuery.sortBy]: normalizedQuery.sortOrder,
    _id: -1,
  };

  const [items, total] = await Promise.all([
    Role.find(filter)
      .populate({
        path: "permissions",
        select: "_id key module action description isActive",
      })
      .populate("createdBy", "_id firstName lastName email")
      .populate("updatedBy", "_id firstName lastName email")
      .sort(sort)
      .skip(normalizedQuery.skip)
      .limit(normalizedQuery.limit)
      .lean(),
    Role.countDocuments(filter),
  ]);

  return {
    items,
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

export const createRoleService = async ({
  currentUserId,
  organizationId,
  payload,
  session = null,
}) => {
  const {
    name,
    code,
    description,
    permissionIds,
    permissionKeys,
    accessScope,
    priority,
  } = validateCreateRolePayload(payload);

  // 1) Current user's active membership in this organization
  const membership = await getActiveMembershipOrThrow({
    organizationId,
    userId: currentUserId,
    session,
  });

  // 2) Current user's effective permissions across all assigned roles
  const {
    permissionIdSet: creatorPermissionIdSet,
    permissionKeySet: creatorPermissionKeySet,
  } = await getEffectivePermissionsForMember({
    organizationId,
    roleIds: membership.roles,
    session,
  });

  // 3) Must have role:create permission
  if (!creatorPermissionKeySet.has(ROLE_PERMISSION_KEYS.CREATE)) {
    throw new ApiError(403, "You do not have permission to create roles");
  }

  // 4) Unique name/code inside organization
  const existingRole = await Role.findOne({
    organization: organizationId,
    $or: [{ name }, { code }],
    isDeleted: false,
  })
    .session(session)
    .lean();

  if (existingRole) {
    if (existingRole.name === name) {
      throw new ApiError(409, "Role name already exists in this organization");
    }

    if (existingRole.code === code) {
      throw new ApiError(409, "Role code already exists in this organization");
    }

    throw new ApiError(409, "Role already exists");
  }

  // 5) Resolve requested permissions
  const requestedPermissions = await resolveRequestedPermissions({
    permissionIds,
    permissionKeys,
    session,
  });

  // 6) Privilege escalation protection
  assertCreatorCanAssignPermissions({
    requestedPermissions,
    creatorPermissionIdSet,
    creatorPermissionKeySet,
  });

  // 7) Create role
  const [createdRole] = await Role.create(
    [
      {
        organization: organizationId,
        name,
        code,
        description,
        permissions: requestedPermissions.map((permission) => permission._id),
        accessScope,
        isSystem: false,
        isDefault: false,
        priority,
        status: ROLE_STATUS.ACTIVE,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    ],
    { session },
  );

  // 8) Return populated role
  return getRoleByIdForOrganization({
    roleId: createdRole._id,
    organizationId,
    session,
  });
};

export const getRoleByIdService = async ({ roleId, organizationId }) => {
  return getRoleByIdForOrganization({
    roleId,
    organizationId,
  });
};

export const updateRoleService = async ({
  roleId,
  currentUserId,
  organizationId,
  payload,
  session = null,
}) => {
  validateObjectId(roleId, "roleId");

  const update = validateUpdateRolePayload(payload);

  // 1) Current user's active membership
  const membership = await getActiveMembershipOrThrow({
    organizationId,
    userId: currentUserId,
    session,
  });

  // 2) Current user's effective permissions
  const {
    permissionIdSet: editorPermissionIdSet,
    permissionKeySet: editorPermissionKeySet,
  } = await getEffectivePermissionsForMember({
    organizationId,
    roleIds: membership.roles,
    session,
  });

  // 3) Must have role:update permission
  if (!editorPermissionKeySet.has(ROLE_PERMISSION_KEYS.UPDATE)) {
    throw new ApiError(403, "You do not have permission to update roles");
  }

  // 4) Fetch role
  const role = await Role.findOne({
    _id: roleId,
    organization: organizationId,
    isDeleted: false,
  }).session(session);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  assertRoleBelongsToOrganization(role, organizationId);
  assertRoleUpdatable(role);

  // 5) Duplicate name check if changed
  if ("name" in update && update.name !== role.name) {
    const existingByName = await Role.findOne({
      organization: organizationId,
      name: update.name,
      isDeleted: false,
      _id: { $ne: role._id },
    })
      .session(session)
      .lean();

    if (existingByName) {
      throw new ApiError(409, "Role name already exists in this organization");
    }

    role.name = update.name;
  }

  // 6) Duplicate code check if changed
  if ("code" in update && update.code !== role.code) {
    const existingByCode = await Role.findOne({
      organization: organizationId,
      code: update.code,
      isDeleted: false,
      _id: { $ne: role._id },
    })
      .session(session)
      .lean();

    if (existingByCode) {
      throw new ApiError(409, "Role code already exists in this organization");
    }

    role.code = update.code;
  }

  // 7) Other primitive fields
  if ("description" in update) {
    role.description = update.description;
  }

  if ("priority" in update) {
    role.priority = update.priority;
  }

  if ("status" in update) {
    role.status = update.status;
  }

  // 8) Permissions update
  if ("permissionIds" in update || "permissionKeys" in update) {
    const requestedPermissions = await resolveRequestedPermissions({
      permissionIds: update.permissionIds || [],
      permissionKeys: update.permissionKeys || [],
      session,
    });

    assertCreatorCanAssignPermissions({
      requestedPermissions,
      creatorPermissionIdSet: editorPermissionIdSet,
      creatorPermissionKeySet: editorPermissionKeySet,
    });

    role.permissions = requestedPermissions.map((permission) => permission._id);
  }

  // 9) Partial accessScope patch
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
  await role.save({ session });

  return getRoleByIdForOrganization({
    roleId: role._id,
    organizationId,
    session,
  });
};

export const deleteRoleService = async ({
  roleId,
  currentUserId,
  organizationId,
  session = null,
}) => {
  validateObjectId(roleId, "roleId");

  // 1) Current user's active membership
  const membership = await getActiveMembershipOrThrow({
    organizationId,
    userId: currentUserId,
    session,
  });

  // 2) Current user's effective permissions
  const { permissionKeySet } = await getEffectivePermissionsForMember({
    organizationId,
    roleIds: membership.roles,
    session,
  });

  // 3) Must have role:delete permission
  if (!permissionKeySet.has(ROLE_PERMISSION_KEYS.DELETE)) {
    throw new ApiError(403, "You do not have permission to delete roles");
  }

  // 4) Find role
  const role = await Role.findOne({
    _id: roleId,
    organization: organizationId,
    isDeleted: false,
  }).session(session);

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  // 5) Deletion guards
  await assertRoleDeletable({
    role,
    organizationId,
    session,
  });

  // 6) Soft delete
  role.isDeleted = true;
  role.deletedAt = new Date();
  role.status = ROLE_STATUS.INACTIVE;
  role.updatedBy = currentUserId;

  await role.save({ session });

  return {
    deletedRoleId: role._id,
  };
};
