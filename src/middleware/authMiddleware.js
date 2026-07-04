import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/userModel.js";

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

    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: {
        path: "permissions",
        model: "Permission",
      },
    });

    if (!user) {
      return next(new ApiError(401, "Unauthorized: user not found"));
    }

    if (!user.isActive || user.status !== "ACTIVE") {
      return next(new ApiError(403, "Your account is inactive or suspended"));
    }

    if (!user.roleId || !user.roleId.isActive) {
      return next(new ApiError(403, "User role is inactive or missing"));
    }

    const permissionKeys = (user.roleId.permissions || []).map(
      (permission) => permission.key,
    );

    req.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId._id,
      roleName: user.roleId.name,
      managerId: user.managerId || null,
      permissions: permissionKeys,
      accessScope: user.roleId.accessScope || {},
      rawUser: user,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  protect,
};
