import profileService from "./profileService.js";

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const profile = await profileService.updateProfile(req.user._id, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Avatar
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const profile = await profileService.uploadAvatar(req.user.id, req.file);

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully.",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change Password
 */
const changePassword = async (req, res, next) => {
  try {
    await profileService.changePassword(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
};
