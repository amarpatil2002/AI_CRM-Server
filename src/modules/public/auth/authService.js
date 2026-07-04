import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../service/emailService.js";
import { verifyEmailTemplate } from "../../../utils/emailTemplates.js";
import mongoose from "mongoose";
import User from "../../../models/userModel.js";
import Organization from "../../../models/orgnizationModel.js";
import ApiError from "../../../utils/apiError.js";

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

/**
 * Generate unique organization slug
 */
const generateOrganizationSlug = async (organizationName, session) => {
  const baseSlug = organizationName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let slug = baseSlug;
  let counter = 1;

  while (await Organization.exists({ slug }).session(session)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

const EMAIL_VERIFY_TOKEN_EXPIRES_MINUTES =
  Number(process.env.EMAIL_VERIFY_TOKEN_EXPIRES_MINUTES) || 1440;

const RESEND_VERIFICATION_COOLDOWN_SECONDS =
  Number(process.env.RESEND_VERIFICATION_COOLDOWN_SECONDS) || 60;

/**
 * Normalize email input for consistent lookup/storage.
 */
const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

/* -------------------------------------------------------------------------- */
/*                               AUTH SERVICES                                */
/* -------------------------------------------------------------------------- */

/**
 * Register first owner/admin with organization
 * Use this for initial signup
 */

export const registerUser = async (payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { firstName, lastName, email, password, organizationName, phone } =
      payload;

    firstName = firstName?.trim();
    lastName = lastName?.trim();
    email = email?.trim().toLowerCase();
    organizationName = organizationName?.trim();
    phone = phone?.trim();

    if (!firstName || !lastName || !email || !password || !organizationName) {
      throw new ApiError(400, "All required fields must be provided");
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long");
    }

    const existingUser = await User.findOne({ email }).session(session);

    if (existingUser) {
      throw new ApiError(409, "User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 1) Create user first
    const [user] = await User.create(
      [
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone,
          organizationId: null,
          roleId: null, // assign later when role system is added
          isEmailVerified: false,
          isActive: true,
          authProvider: "local",
        },
      ],
      { session },
    );

    // 2) Create organization
    const slug = await generateOrganizationSlug(organizationName, session);

    const [organization] = await Organization.create(
      [
        {
          name: organizationName,
          slug,
          owner: user._id,
          email,
          status: "ACTIVE",
          subscription: {
            plan: "FREE",
            startsAt: new Date(),
          },
        },
      ],
      { session },
    );

    // 3) Link organization to user
    user.organizationId = organization._id;

    // 4) Generate email verification token
    const rawVerifyToken = crypto.randomBytes(32).toString("hex");

    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(rawVerifyToken)
      .digest("hex");

    user.emailVerificationToken = hashedVerifyToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save({
      session,
      validateBeforeSave: false,
    });

    // 5) Commit DB transaction first
    await session.commitTransaction();
    session.endSession();

    // 6) Send verification email AFTER commit
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawVerifyToken}`;

    const { subject, html } = verifyEmailTemplate({
      name: user.firstName,
      verifyUrl,
    });

    try {
      await sendEmail({
        to: user.email,
        subject,
        html,
      });
    } catch (emailError) {
      // account is created successfully, but email failed
      // don't rollback DB now because transaction already committed
      console.error("Verification email send failed:", emailError.message);
    }

    return {
      message: "Registration successful. Please verify your email to continue.",
      user: sanitizeUser(user),
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error?.code === 11000) {
      if (error.keyPattern?.email) {
        throw new ApiError(409, "User already exists with this email");
      }

      if (error.keyPattern?.slug) {
        throw new ApiError(409, "Organization slug already exists");
      }
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, error.message || "Failed to register user");
  }
};

export const verifyEmail = async ({ token }) => {
  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Verification token is required");
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select(
    "+emailVerificationToken +emailVerificationExpires email firstName lastName isEmailVerified emailVerifiedAt",
  );

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  // Optional extra guard
  if (user.isEmailVerified) {
    return {
      message: "Email is already verified",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt || null,
      },
    };
  }

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();

  // Invalidate token so it cannot be reused
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;

  await user.save();

  return {
    message: "Email verified successfully",
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
    },
  };
};

/**
 * Resend verification email.
 *
 * Security posture:
 * - Return a generic success message even if user doesn't exist
 * - Return the same generic message if email is already verified
 *   This reduces account enumeration risk.
 */

export const resendVerificationEmail = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required");
  }

  const genericMessage =
    "If the account exists and is not verified, a verification email has been sent.";

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationToken +emailVerificationExpires email firstName isEmailVerified lastVerificationEmailSentAt verificationEmailSendCount",
  );

  // Do not reveal whether account exists
  if (!user) {
    return {
      message: genericMessage,
      sentTo: normalizedEmail,
      expiresAt: null,
    };
  }

  // Do not reveal verified status either
  if (user.isEmailVerified) {
    return {
      message: genericMessage,
      sentTo: normalizedEmail,
      expiresAt: null,
    };
  }

  // Cooldown to prevent abuse/spam
  if (user.lastVerificationEmailSentAt) {
    const secondsSinceLastSend = Math.floor(
      (Date.now() - new Date(user.lastVerificationEmailSentAt).getTime()) /
        1000,
    );

    if (secondsSinceLastSend < RESEND_VERIFICATION_COOLDOWN_SECONDS) {
      throw new ApiError(
        429,
        `Please wait ${RESEND_VERIFICATION_COOLDOWN_SECONDS - secondsSinceLastSend} seconds before requesting another verification email`,
      );
    }
  }

  const { rawToken, hashedToken } = generateVerificationTokenPair();
  const expiresAt = getVerificationExpiryDate();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expiresAt;
  user.lastVerificationEmailSentAt = new Date();
  user.verificationEmailSendCount =
    Number(user.verificationEmailSendCount || 0) + 1;

  await user.save();

  const verifyUrl = buildVerificationUrl(rawToken);

  const { subject, html, text } = getVerificationEmailTemplate({
    firstName: user.firstName,
    verifyUrl,
  });

  try {
    await sendMail({
      to: user.email,
      subject,
      html,
      text,
    });
  } catch (error) {
    // Roll back verification token fields if email sending fails
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    throw new ApiError(
      500,
      "Failed to send verification email. Please try again later.",
    );
  }

  return {
    message: genericMessage,
    sentTo: user.email,
    expiresAt,
  };
};

/**
 * Login user
 */

export const login = async ({ email, password }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +refreshToken",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.authProvider !== "local") {
    throw new ApiError(
      400,
      `This account uses ${user.authProvider} login. Please sign in with ${user.authProvider}.`,
    );
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account is inactive. Contact admin.");
  }

  // Optional: enable if you want email verification before login
  // if (!user.isEmailVerified) {
  //   throw new ApiError(403, "Please verify your email before logging in");
  // }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken, hashedRefreshToken } =
    await generateAuthTokens(user);

  user.lastLoginAt = new Date();
  user.refreshToken = hashedRefreshToken;

  await user.save({ validateBeforeSave: false });

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
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account has been disabled");
  }

  if (!user.refreshToken) {
    throw new ApiError(401, "Session has expired. Please login again.");
  }

  const isValid = await compareToken(refreshToken, user.refreshToken);

  if (!isValid) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Rotate refresh token
  const {
    accessToken,
    refreshToken: newRefreshToken,
    hashedRefreshToken,
  } = await generateAuthTokens(user);

  user.refreshToken = hashedRefreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  return {
    message: "Access token refreshed successfully",
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
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  const user = await User.findById(userId).select("+refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = null;
  user.lastLogoutAt = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  return {
    message: "Logged out successfully",
  };
};

/**
 * Forgot password
 * Generate reset token and save hashed token in DB
 */

export const forgotPassword = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required");
  }

  const genericResponse = {
    message:
      "If an account exists with this email, a password reset link has been sent.",
  };

  const user = await User.findOne({ email: normalizedEmail });

  // Never reveal whether account exists
  if (!user) {
    return genericResponse;
  }

  // Optional: block reset for social-login-only accounts
  if (user.authProvider && user.authProvider !== "local") {
    return genericResponse;
  }

  const rawResetToken = crypto.randomBytes(32).toString("hex");

  const hashedResetToken = crypto
    .createHash("sha256")
    .update(rawResetToken)
    .digest("hex");

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawResetToken}`;

  // Production: send email instead of returning token
  // await sendEmail({
  //   to: user.email,
  //   subject: "Reset your password",
  //   html: `<p>Click here to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
  // });

  return genericResponse;
};

/**
 * Reset password using token
 */

export const resetPassword = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    throw new ApiError(400, "Token and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Force logout from all active sessions in current architecture
  user.refreshToken = null;

  // Optional security metadata
  user.passwordChangedAt = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  return {
    message: "Password reset successful. Please login again.",
  };
};

/**
 * Change password for logged-in user
 */

export const changePassword = async (userId, currentPassword, newPassword) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  const user = await User.findById(userId).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.authProvider && user.authProvider !== "local") {
    throw new ApiError(
      400,
      `This account uses ${user.authProvider} login and does not support password change.`,
    );
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const isSameAsOldPassword = await bcrypt.compare(newPassword, user.password);

  if (isSameAsOldPassword) {
    throw new ApiError(
      400,
      "New password must be different from the current password",
    );
  }

  user.password = await bcrypt.hash(newPassword, 12);

  // Invalidate current refresh-token based session
  user.refreshToken = null;

  // Security metadata
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save({
    validateBeforeSave: false,
  });

  return {
    message: "Password changed successfully. Please login again.",
  };
};

/**
 * Get current logged-in user profile
 */

export const getMe = async (userId) => {
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(userId)
    .select("-password -refreshToken -passwordResetToken -passwordResetExpires")
    .populate("organizationId", "name slug")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    user: sanitizeUser(user),
  };
};
