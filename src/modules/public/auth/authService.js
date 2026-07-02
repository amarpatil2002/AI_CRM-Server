import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../../../models/userModel.js";
import Organization from "../../../models/orgnizationModel.js";

/* -------------------------------------------------------------------------- */
/*                               HELPER FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const hashToken = async (token) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
};

const compareToken = async (rawToken, hashedToken) => {
  return bcrypt.compare(rawToken, hashedToken);
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;

  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;

  return userObj;
};

const generateAuthTokens = async (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const hashedRefreshToken = await hashToken(refreshToken);

  return {
    accessToken,
    refreshToken,
    hashedRefreshToken,
  };
};

/* -------------------------------------------------------------------------- */
/*                               AUTH SERVICES                                */
/* -------------------------------------------------------------------------- */

/**
 * Register first owner/admin with organization
 * Use this for initial signup
 */
export const register = async (payload) => {
  const { firstName, lastName, email, password, organizationName, phone } =
    payload;

  // 1. Check existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // 2. Create organization
  const organization = await Organization.create({
    name: organizationName,
    slug: organizationName.toLowerCase().replace(/\s+/g, "-"),
  });

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Create owner/admin user
  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    organizationId: organization._id,
    role: "owner", // change if your role field stores ObjectId or enum
    isEmailVerified: false,
    isActive: true,
    authProvider: "local",
  });

  // 5. Generate tokens
  const { accessToken, refreshToken, hashedRefreshToken } =
    await generateAuthTokens(user);

  // 6. Save hashed refresh token
  user.refreshToken = hashedRefreshToken;
  await user.save();

  return {
    message: "User registered successfully",
    user: sanitizeUser(user),
    organization,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Login user
 */
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +refreshToken",
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive. Contact admin.");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }

  const { accessToken, refreshToken, hashedRefreshToken } =
    await generateAuthTokens(user);

  user.lastLoginAt = new Date();
  user.refreshToken = hashedRefreshToken;
  await user.save();

  return {
    message: "Login successful",
    user: sanitizeUser(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.refreshToken) {
    throw new Error("No active session found");
  }

  const isRefreshTokenValid = await compareToken(
    refreshToken,
    user.refreshToken,
  );

  if (!isRefreshTokenValid) {
    throw new Error("Invalid refresh token");
  }

  // rotate refresh token
  const {
    accessToken,
    refreshToken: newRefreshToken,
    hashedRefreshToken,
  } = await generateAuthTokens(user);

  user.refreshToken = hashedRefreshToken;
  await user.save();

  return {
    message: "Token refreshed successfully",
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  };
};

/**
 * Logout user
 */
export const logout = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.refreshToken = null;
  await user.save();

  return {
    message: "Logged out successfully",
  };
};

/**
 * Forgot password
 * Generate reset token and save hashed token in DB
 */
export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // do not reveal whether email exists
    return {
      message:
        "If an account exists with this email, a reset link has been sent.",
    };
  }

  const rawResetToken = crypto.randomBytes(32).toString("hex");

  const hashedResetToken = crypto
    .createHash("sha256")
    .update(rawResetToken)
    .digest("hex");

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await user.save();

  // frontend reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawResetToken}`;

  // Later you can send email here
  return {
    message: "Password reset link generated successfully",
    resetToken: rawResetToken, // remove in production after email integration
    resetUrl,
  };
};

/**
 * Reset password using token
 */
export const resetPassword = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshToken = null; // force login again on all devices
  await user.save();

  return {
    message: "Password reset successful. Please login again.",
  };
};

/**
 * Change password for logged-in user
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.refreshToken = null; // invalidate old sessions
  await user.save();

  return {
    message: "Password changed successfully. Please login again.",
  };
};

/**
 * Get current logged-in user profile
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId)
    .populate("organizationId", "name slug")
    .lean();

  if (!user) {
    throw new Error("User not found");
  }

  return {
    user,
  };
};
