import ApiError from "../utils/ApiError.js";

export const ensureSameOrganization = (
  resourceOrganizationId,
  userOrganizationId,
) => {
  if (!resourceOrganizationId || !userOrganizationId) {
    throw new ApiError(403, "Organization validation failed");
  }

  if (String(resourceOrganizationId) !== String(userOrganizationId)) {
    throw new ApiError(
      403,
      "Access denied: cross-organization access is not allowed",
    );
  }
};

export default {
  ensureSameOrganization,
};
