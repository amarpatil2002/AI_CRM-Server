import ApiError from "../utils/apiError.js";

const normalizePermissions = (permissions = []) => {
  return permissions
    .filter(Boolean)
    .map((permission) => String(permission).trim().toLowerCase())
    .filter(Boolean);
};

const getUserPermissions = (req) => {
  return normalizePermissions(req?.user?.permissions || []);
};

/**
 * Require a single permission
 * Example:
 * authorize("lead.create")
 */
export const authorize = (requiredPermission) => {
  const required = String(requiredPermission || "")
    .trim()
    .toLowerCase();

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!required) {
      return next(new ApiError(500, "Authorization middleware misconfigured"));
    }

    const userPermissions = getUserPermissions(req);

    if (!userPermissions.includes(required)) {
      return next(
        new ApiError(
          403,
          `Forbidden: missing required permission "${required}"`,
        ),
      );
    }

    next();
  };
};

/**
 * Require at least one permission from the list
 * Example:
 * authorizeAny(["lead.read", "lead.read_own"])
 */
export const authorizeAny = (requiredPermissions = []) => {
  const normalizedRequired = normalizePermissions(requiredPermissions);

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!normalizedRequired.length) {
      return next(new ApiError(500, "Authorization middleware misconfigured"));
    }

    const userPermissions = getUserPermissions(req);

    const hasAtLeastOne = normalizedRequired.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAtLeastOne) {
      return next(
        new ApiError(
          403,
          `Forbidden: requires one of [${normalizedRequired.join(", ")}]`,
        ),
      );
    }

    next();
  };
};

/**
 * Require all permissions from the list
 * Example:
 * authorizeAll(["lead.read", "lead.update"])
 */
export const authorizeAll = (requiredPermissions = []) => {
  const normalizedRequired = normalizePermissions(requiredPermissions);

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!normalizedRequired.length) {
      return next(new ApiError(500, "Authorization middleware misconfigured"));
    }

    const userPermissions = getUserPermissions(req);

    const missingPermissions = normalizedRequired.filter(
      (permission) => !userPermissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      return next(
        new ApiError(
          403,
          `Forbidden: missing permissions [${missingPermissions.join(", ")}]`,
        ),
      );
    }

    next();
  };
};

export default {
  authorize,
  authorizeAny,
  authorizeAll,
};
