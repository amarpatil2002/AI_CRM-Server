import ApiResponse from "../../../utils/ApiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import * as authService from "./authService.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, result, "User registered successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  return res.status(200).json(new ApiResponse(200, result, "Login successful"));
});

export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Current user fetched successfully"));
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logoutUser(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Logout successful"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Password reset link sent successfully"),
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Password reset successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Password changed successfully"));
});
