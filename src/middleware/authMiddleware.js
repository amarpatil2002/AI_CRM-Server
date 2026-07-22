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

const normalizePermissionKeys = (role) => {
  if (!role || role.status !== "ACTIVE" || role.isDeleted) {
    return [];
  }

  const permissionSet = new Set();

  for (const permission of role.permissions || []) {
    if (!permission?.key) continue;
    permissionSet.add(permission.key);
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
        path: "role",
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

    if (!member.role) {
      return next(new ApiError(403, "No active role assigned to this user"));
    }

    const permissionKeys = normalizePermissionKeys(member.role);

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

      roleId: member.role._id,
      roleName: member.role.name,
      roleCode: member.role.code,

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
