import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../service/emailService.js";
import { verifyEmailOtpTemplate } from "../../../utils/emailTemplates.js";
import mongoose from "mongoose";
import User from "../../../models/userModel.js";
import Organization from "../../../models/orgnizationModel.js";
import ApiError from "../../../utils/apiError.js";
import { createDefaultRolesForOrganization } from "../../../helpers/createDefaultRolesForOrganization.js";

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

const EMAIL_OTP_EXPIRES_MINUTES =
  Number(process.env.EMAIL_OTP_EXPIRES_MINUTES) || 10;

const EMAIL_OTP_RESEND_COOLDOWN_SECONDS =
  Number(process.env.EMAIL_OTP_RESEND_COOLDOWN_SECONDS) || 60;

const EMAIL_OTP_MAX_ATTEMPTS = Number(process.env.EMAIL_OTP_MAX_ATTEMPTS) || 5;

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const generateEmailOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
};

const getEmailOtpExpiryDate = () => {
  return new Date(Date.now() + EMAIL_OTP_EXPIRES_MINUTES * 60 * 1000);
};

const sendVerificationOtpEmail = async ({ email, firstName, otp }) => {
  const { subject, html, text } = verifyEmailOtpTemplate({
    name: firstName,
    otp,
  });

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

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
    email = normalizeEmail(email);
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

    // Create organization first
    const slug = await generateOrganizationSlug(organizationName, session);

    const [organization] = await Organization.create(
      [
        {
          name: organizationName,
          slug,
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

    // Create default roles for this organization
    const { ownerRole } = await createDefaultRolesForOrganization(
      organization._id,
      session,
    );

    if (!ownerRole) {
      throw new ApiError(500, "Owner role could not be created");
    }

    // Generate email OTP
    const rawOtp = generateEmailOtp();
    const hashedOtp = hashOtp(rawOtp);

    // Create first user as OWNER of organization
    const [user] = await User.create(
      [
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone,
          organizationId: organization._id,
          roleId: ownerRole._id,
          isEmailVerified: false,
          isActive: true,
          authProvider: "local",
          emailVerificationOtp: hashedOtp,
          emailVerificationOtpExpires: getEmailOtpExpiryDate(),
          emailVerificationOtpAttempts: 0,
          lastEmailVerificationOtpSentAt: new Date(),
        },
      ],
      { session },
    );

    // Update organization owner
    organization.owner = user._id;
    await organization.save({ session });

    await session.commitTransaction();
    session.endSession();

    try {
      await sendVerificationOtpEmail({
        email: user.email,
        firstName: user.firstName,
        otp: rawOtp,
      });
    } catch (emailError) {
      console.error("Verification OTP send failed:", emailError.message);
    }

    return {
      message:
        "Registration successful. Please verify your email using the OTP sent to your inbox.",
      requiresEmailVerification: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        organizationId: user.organizationId,
        roleId: user.roleId,
      },
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

export const verifyEmailOtp = async ({ email, otp }) => {
  try {
    const normalizedEmail = normalizeEmail(email);
    const normalizedOtp = String(otp || "").trim();

    if (!normalizedEmail || !normalizedOtp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+emailVerificationOtp +emailVerificationOtpExpires +emailVerificationOtpAttempts email firstName lastName isEmailVerified emailVerifiedAt",
    );

    if (!user) {
      throw new ApiError(400, "Invalid email or OTP");
    }

    if (user.isEmailVerified) {
      return {
        message: "Email is already verified",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt || null,
        },
      };
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
      throw new ApiError(400, "Invalid email or OTP");
    }

    if (user.emailVerificationOtpExpires.getTime() < Date.now()) {
      throw new ApiError(400, "OTP has expired. Please request a new OTP.");
    }

    if (user.emailVerificationOtpAttempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      throw new ApiError(
        429,
        "Maximum OTP verification attempts exceeded. Please request a new OTP.",
      );
    }

    const hashedOtp = hashOtp(normalizedOtp);

    if (hashedOtp !== user.emailVerificationOtp) {
      user.emailVerificationOtpAttempts += 1;
      await user.save({ validateBeforeSave: false });

      const remainingAttempts =
        EMAIL_OTP_MAX_ATTEMPTS - user.emailVerificationOtpAttempts;

      throw new ApiError(
        400,
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
          : "Maximum OTP verification attempts exceeded. Please request a new OTP.",
      );
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    user.emailVerificationOtpAttempts = 0;

    await user.save({ validateBeforeSave: false });

    return {
      message: "Email verified successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  } catch (error) {
    console.error("verifyEmailOtp service failed", {
      email,
      error: error.message,
      statusCode: error.statusCode || 500,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to verify email OTP");
  }
};

export const resendEmailVerificationOtp = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required");
  }

  const genericMessage =
    "If the account exists and is not verified, a new OTP has been sent to the email address.";

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationOtp +emailVerificationOtpExpires +emailVerificationOtpAttempts email firstName isEmailVerified lastEmailVerificationOtpSentAt",
  );

  // Prevent account enumeration
  if (!user) {
    return {
      message: genericMessage,
      sentTo: normalizedEmail,
      expiresAt: null,
    };
  }

  // Don't reveal verification status
  if (user.isEmailVerified) {
    return {
      message: genericMessage,
      sentTo: normalizedEmail,
      expiresAt: null,
    };
  }

  if (user.lastEmailVerificationOtpSentAt) {
    const secondsSinceLastSend = Math.floor(
      (Date.now() - new Date(user.lastEmailVerificationOtpSentAt).getTime()) /
        1000,
    );

    if (secondsSinceLastSend < EMAIL_OTP_RESEND_COOLDOWN_SECONDS) {
      throw new ApiError(
        429,
        `Please wait ${
          EMAIL_OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend
        } seconds before requesting another OTP`,
      );
    }
  }

  const rawOtp = generateEmailOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = getEmailOtpExpiryDate();

  // keep previous values in case email sending fails
  const previousOtp = user.emailVerificationOtp;
  const previousOtpExpires = user.emailVerificationOtpExpires;
  const previousOtpAttempts = user.emailVerificationOtpAttempts;
  const previousLastSentAt = user.lastEmailVerificationOtpSentAt;

  user.emailVerificationOtp = hashedOtp;
  user.emailVerificationOtpExpires = expiresAt;
  user.emailVerificationOtpAttempts = 0;
  user.lastEmailVerificationOtpSentAt = new Date();

  await user.save({ validateBeforeSave: false });

  try {
    await sendVerificationOtpEmail({
      email: user.email,
      firstName: user.firstName,
      otp: rawOtp,
    });
  } catch (error) {
    // rollback OTP state if email sending fails
    user.emailVerificationOtp = previousOtp;
    user.emailVerificationOtpExpires = previousOtpExpires;
    user.emailVerificationOtpAttempts = previousOtpAttempts;
    user.lastEmailVerificationOtpSentAt = previousLastSentAt;

    await user.save({ validateBeforeSave: false });

    throw new ApiError(
      500,
      "Failed to send verification OTP. Please try again later.",
    );
  }

  return {
    message: genericMessage,
    sentTo: user.email,
    expiresAt,
  };
};

export const loginUser = async ({ email, password }) => {
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

  // Block login until email is verified
  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in", {
      requiresEmailVerification: true,
      email: user.email,
    });
  }

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

export const refreshAccessToken = async ({ refreshToken }) => {
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId).select(
    "+refreshToken isActive isEmailVerified",
  );

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account has been disabled");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before continuing", {
      requiresEmailVerification: true,
      email: user.email,
    });
  }

  if (!user.refreshToken) {
    throw new ApiError(401, "Session has expired. Please login again.");
  }

  const isValid = await compareToken(refreshToken, user.refreshToken);

  if (!isValid) {
    throw new ApiError(401, "Invalid refresh token");
  }

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

export const logoutUser = async (userId) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  const user = await User.findById(userId).select("+refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = null;
  user.lastLogoutAt = new Date();

  await user.save({ validateBeforeSave: false });

  return {
    message: "Logout successful",
  };
};

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
