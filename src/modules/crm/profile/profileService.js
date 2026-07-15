import bcrypt from "bcryptjs";
import User from "../../../models/userModel.js";
import AppError from "../../../utils/apiError.js";

const getProfile = async (userId) => {
  const profile = await User.findById(userId).select("-password -refreshToken");

  if (!profile) {
    throw new AppError(404, "Profile not found.");
  }

  return profile;
};

const updateProfile = async (userId, payload) => {
  const profile = await User.findById(userId);

  if (!profile) {
    throw new AppError("Profile not found.", 404);
  }

  profile.firstName = payload.firstName.trim();
  profile.lastName = payload.lastName.trim();
  profile.phone = payload.phone ?? null;

  // If you store fullName in MongoDB
  profile.fullName = `${profile.firstName} ${profile.lastName}`;

  await profile.save();

  return await User.findById(userId).select("-password -refreshToken");
};

const uploadAvatar = async (userId, avatarUrl) => {
  const profile = await User.findById(userId);

  if (!profile) {
    throw new AppError("Profile not found.", 404);
  }

  profile.avatar = avatarUrl;

  await profile.save();

  return profile.avatar;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const profile = await User.findById(userId).select("+password");

  if (!profile) {
    throw new AppError("Profile not found.", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, profile.password);

  if (!isMatch) {
    throw new AppError("Current password is incorrect.", 400);
  }

  profile.password = await bcrypt.hash(newPassword, 12);

  profile.passwordChangedAt = new Date();

  profile.refreshToken = null;

  await profile.save();
};

export default {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
};
