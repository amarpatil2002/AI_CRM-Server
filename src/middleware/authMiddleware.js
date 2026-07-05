import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/userModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const normalizePermissionKeys = (roles = []) => {
  const permissionSet = new Set();

  for (const role of roles) {
    if (!role || role.status !== "ACTIVE" || role.isDeleted) continue;

    for (const permission of role.permissions || []) {
      if (!permission || !permission.key) continue;
      permissionSet.add(permission.key);
    }
  }

  return [...permissionSet];
};

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(new ApiError(401, "Unauthorized: access token missing"));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return next(new ApiError(401, "Unauthorized: invalid or expired token"));
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new ApiError(401, "Unauthorized: user not found"));
    }

    if (!user.isActive || user.status !== "ACTIVE") {
      return next(new ApiError(403, "Your account is inactive or suspended"));
    }

    const member = await OrganizationMember.findOne({
      user: user._id,
      status: "ACTIVE",
    })
      .populate({
        path: "organization",
        select: "_id name slug status owner isDeleted",
      })
      .populate({
        path: "roles",
        match: {
          status: "ACTIVE",
          isDeleted: false,
        },
        populate: {
          path: "permissions",
          match: {
            isActive: true,
          },
          select: "key label module action scope",
        },
      });

    if (!member) {
      return next(
        new ApiError(
          403,
          "No active organization membership found for this user",
        ),
      );
    }

    if (!member.organization) {
      return next(new ApiError(403, "Organization not found for this member"));
    }

    if (
      member.organization.isDeleted ||
      member.organization.status !== "ACTIVE"
    ) {
      return next(
        new ApiError(403, "Your organization is inactive or unavailable"),
      );
    }

    if (!member.roles || member.roles.length === 0) {
      return next(new ApiError(403, "No active roles assigned to this user"));
    }

    const permissionKeys = normalizePermissionKeys(member.roles);

    req.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,

      organizationId: member.organization._id,
      organization: {
        _id: member.organization._id,
        name: member.organization.name,
        slug: member.organization.slug,
        owner: member.organization.owner,
        status: member.organization.status,
      },

      memberId: member._id,
      memberStatus: member.status,

      roleIds: member.roles.map((role) => role._id),
      roleNames: member.roles.map((role) => role.name),
      roleCodes: member.roles.map((role) => role.code),

      permissions: permissionKeys,

      rawUser: user,
      rawMember: member,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  protect,
};
