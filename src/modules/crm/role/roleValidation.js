import mongoose from "mongoose";
import ApiError from "../../../utils/apiError.js";
import {
  DEFAULT_ACCESS_SCOPE,
  RESERVED_ROLE_CODES,
  ROLE_STATUS,
  SCOPED_ROLE_MODULES,
} from "./roleConstant.js";

const ROLE_NAME_MAX_LENGTH = 100;
const ROLE_CODE_MAX_LENGTH = 100;
const ROLE_DESCRIPTION_MAX_LENGTH = 500;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeNullableString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = normalizeString(value);
  return normalized.length ? normalized : null;
};

export const validateObjectId = (value, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

export const assertValidObjectIdArray = (values, fieldName = "ids") => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new ApiError(400, `${fieldName} must be a non-empty array`);
  }

  const invalid = values.some(
    (value) => !mongoose.Types.ObjectId.isValid(value),
  );
  if (invalid) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const normalizePermissionInputs = ({ permissionIds, permissionKeys }) => {
  const normalizedPermissionIds = Array.isArray(permissionIds)
    ? [...new Set(permissionIds.map((id) => String(id).trim()).filter(Boolean))]
    : [];

  const normalizedPermissionKeys = Array.isArray(permissionKeys)
    ? [
        ...new Set(
          permissionKeys.map((key) => normalizeString(key)).filter(Boolean),
        ),
      ]
    : [];

  if (!normalizedPermissionIds.length && !normalizedPermissionKeys.length) {
    throw new ApiError(
      400,
      "Either permissionIds or permissionKeys must be provided",
    );
  }

  if (normalizedPermissionIds.length && normalizedPermissionKeys.length) {
    throw new ApiError(
      400,
      "Provide either permissionIds or permissionKeys, not both",
    );
  }

  return {
    permissionIds: normalizedPermissionIds,
    permissionKeys: normalizedPermissionKeys,
  };
};

const normalizeAccessScope = (accessScope = {}, { partial = false } = {}) => {
  if (
    accessScope === null ||
    typeof accessScope !== "object" ||
    Array.isArray(accessScope)
  ) {
    throw new ApiError(400, "accessScope must be an object");
  }

  const base = partial ? {} : { ...DEFAULT_ACCESS_SCOPE };

  for (const [moduleName, scopeValue] of Object.entries(accessScope)) {
    if (!SCOPED_ROLE_MODULES.includes(moduleName)) {
      throw new ApiError(400, `Invalid accessScope module: ${moduleName}`);
    }

    if (
      !Object.values(DEFAULT_ACCESS_SCOPE).includes(scopeValue) &&
      !["OWN", "TEAM", "ALL"].includes(scopeValue)
    ) {
      throw new ApiError(
        400,
        `Invalid access scope for ${moduleName}. Allowed values: OWN, TEAM, ALL`,
      );
    }

    base[moduleName] = scopeValue;
  }

  return base;
};

export const validateCreateRolePayload = (payload = {}) => {
  const name = normalizeString(payload.name);
  const code = normalizeString(payload.code).toLowerCase();
  const description = normalizeNullableString(payload.description);
  const priority =
    payload.priority === undefined || payload.priority === null
      ? 0
      : Number(payload.priority);

  if (!name) {
    throw new ApiError(400, "Role name is required");
  }

  if (name.length > ROLE_NAME_MAX_LENGTH) {
    throw new ApiError(
      400,
      `Role name cannot exceed ${ROLE_NAME_MAX_LENGTH} characters`,
    );
  }

  if (!code) {
    throw new ApiError(400, "Role code is required");
  }

  if (code.length > ROLE_CODE_MAX_LENGTH) {
    throw new ApiError(
      400,
      `Role code cannot exceed ${ROLE_CODE_MAX_LENGTH} characters`,
    );
  }

  if (!/^[a-z0-9_]+$/.test(code)) {
    throw new ApiError(
      400,
      "Role code can only contain lowercase letters, numbers, and underscores",
    );
  }

  if (RESERVED_ROLE_CODES.includes(code)) {
    throw new ApiError(400, "This role code is reserved");
  }

  if (description && description.length > ROLE_DESCRIPTION_MAX_LENGTH) {
    throw new ApiError(
      400,
      `Role description cannot exceed ${ROLE_DESCRIPTION_MAX_LENGTH} characters`,
    );
  }

  if (!Number.isInteger(priority) || priority < 0) {
    throw new ApiError(400, "Priority must be a non-negative integer");
  }

  const { permissionIds, permissionKeys } = normalizePermissionInputs(payload);
  const accessScope = normalizeAccessScope(payload.accessScope || {});

  return {
    name,
    code,
    description,
    permissionIds,
    permissionKeys,
    accessScope,
    priority,
  };
};

export const validateUpdateRolePayload = (payload = {}) => {
  const update = {};

  if ("name" in payload) {
    const name = normalizeString(payload.name);
    if (!name) {
      throw new ApiError(400, "Role name cannot be empty");
    }
    if (name.length > ROLE_NAME_MAX_LENGTH) {
      throw new ApiError(
        400,
        `Role name cannot exceed ${ROLE_NAME_MAX_LENGTH} characters`,
      );
    }
    update.name = name;
  }

  if ("code" in payload) {
    const code = normalizeString(payload.code).toLowerCase();

    if (!code) {
      throw new ApiError(400, "Role code cannot be empty");
    }

    if (code.length > ROLE_CODE_MAX_LENGTH) {
      throw new ApiError(
        400,
        `Role code cannot exceed ${ROLE_CODE_MAX_LENGTH} characters`,
      );
    }

    if (!/^[a-z0-9_]+$/.test(code)) {
      throw new ApiError(
        400,
        "Role code can only contain lowercase letters, numbers, and underscores",
      );
    }

    if (RESERVED_ROLE_CODES.includes(code)) {
      throw new ApiError(400, "This role code is reserved");
    }

    update.code = code;
  }

  if ("description" in payload) {
    const description = normalizeNullableString(payload.description);

    if (description && description.length > ROLE_DESCRIPTION_MAX_LENGTH) {
      throw new ApiError(
        400,
        `Role description cannot exceed ${ROLE_DESCRIPTION_MAX_LENGTH} characters`,
      );
    }

    update.description = description;
  }

  if ("priority" in payload) {
    const priority = Number(payload.priority);
    if (!Number.isInteger(priority) || priority < 0) {
      throw new ApiError(400, "Priority must be a non-negative integer");
    }
    update.priority = priority;
  }

  if ("status" in payload) {
    if (!Object.values(ROLE_STATUS).includes(payload.status)) {
      throw new ApiError(
        400,
        `Invalid role status. Allowed values: ${Object.values(ROLE_STATUS).join(", ")}`,
      );
    }
    update.status = payload.status;
  }

  if ("accessScope" in payload) {
    update.accessScope = normalizeAccessScope(payload.accessScope, {
      partial: true,
    });
  }

  if ("permissionIds" in payload || "permissionKeys" in payload) {
    const { permissionIds, permissionKeys } =
      normalizePermissionInputs(payload);
    update.permissionIds = permissionIds;
    update.permissionKeys = permissionKeys;
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  return update;
};

export const normalizeRoleListQuery = (query = {}) => {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number(query.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "name",
    "code",
    "priority",
    "status",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  let isSystem = null;
  if (query.isSystem === "true") isSystem = true;
  if (query.isSystem === "false") isSystem = false;

  let isDefault = null;
  if (query.isDefault === "true") isDefault = true;
  if (query.isDefault === "false") isDefault = false;

  const status = Object.values(ROLE_STATUS).includes(query.status)
    ? query.status
    : null;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search: normalizeString(query.search),
    status,
    isSystem,
    isDefault,
  };
};
