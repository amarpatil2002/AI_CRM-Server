import ApiError from "../utils/ApiError.js";
import { ACCESS_SCOPE } from "../utils/enums.js";

class AccessControlService {
  getScopeForResource(user, resourceName) {
    if (!user || !user.accessScope) {
      return ACCESS_SCOPE.OWN;
    }

    return user.accessScope[resourceName] || ACCESS_SCOPE.OWN;
  }

  canAccessOwnResource(userId, ownerId, assignedToId = null) {
    const currentUserId = String(userId);

    if (ownerId && String(ownerId) === currentUserId) {
      return true;
    }

    if (assignedToId && String(assignedToId) === currentUserId) {
      return true;
    }

    return false;
  }

  canAccessTeamResource({ user, resourceOwnerId, teamUserIds = [] }) {
    if (!user?._id || !resourceOwnerId) return false;

    const currentUserId = String(user._id);

    if (String(resourceOwnerId) === currentUserId) {
      return true;
    }

    return teamUserIds.map(String).includes(String(resourceOwnerId));
  }

  assertResourceAccess({
    user,
    resourceName,
    resource,
    ownerField = "ownerId",
    assignedField = "assignedTo",
    teamUserIds = [],
  }) {
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!resource) {
      throw new ApiError(404, `${resourceName} not found`);
    }

    const scope = this.getScopeForResource(user, resourceName);

    if (scope === ACCESS_SCOPE.ALL) {
      return true;
    }

    const ownerId = resource[ownerField] || null;
    const assignedToId = resource[assignedField] || null;

    if (scope === ACCESS_SCOPE.OWN) {
      const allowed = this.canAccessOwnResource(
        user._id,
        ownerId,
        assignedToId,
      );

      if (!allowed) {
        throw new ApiError(
          403,
          `You can only access your own ${resourceName} records`,
        );
      }

      return true;
    }

    if (scope === ACCESS_SCOPE.TEAM) {
      const allowed = this.canAccessTeamResource({
        user,
        resourceOwnerId: ownerId,
        teamUserIds,
      });

      if (!allowed) {
        throw new ApiError(
          403,
          `You can only access your team ${resourceName} records`,
        );
      }

      return true;
    }

    throw new ApiError(403, "Access denied");
  }

  buildScopedQuery({
    user,
    resourceName,
    ownerField = "ownerId",
    assignedField = "assignedTo",
    teamUserIds = [],
  }) {
    const scope = this.getScopeForResource(user, resourceName);

    if (scope === ACCESS_SCOPE.ALL) {
      return {};
    }

    if (scope === ACCESS_SCOPE.OWN) {
      return {
        $or: [{ [ownerField]: user._id }, { [assignedField]: user._id }],
      };
    }

    if (scope === ACCESS_SCOPE.TEAM) {
      const ids = [user._id, ...teamUserIds];
      return {
        [ownerField]: { $in: ids },
      };
    }

    return {
      [ownerField]: user._id,
    };
  }
}

const accessControlService = new AccessControlService();

export default accessControlService;
