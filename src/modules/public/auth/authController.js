import ApiResponse from "../../../utils/apiResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import * as authService from "./authService.js";
import { REFRESH_TOKEN_COOKIE_NAME } from "../../../utils/constants.js";
import { getRefreshTokenCookieOptions } from "../../../utils/cookieUtils.js";

const getValidatedBody = (req) => req.validated?.body || req.body;
const getValidatedParams = (req) => req.validated?.params || req.params;
const getValidatedQuery = (req) => req.validated?.query || req.query;
const getUserId = (req) => req.user?._id || req.user?.id || req.user;

export const register = asyncHandler(async (req, res) => {
  const body = getValidatedBody(req);

  const result = await authService.registerUser(body);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result,
        result.message || "User registered successfully",
      ),
    );
});

export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const body = getValidatedBody(req);
  const result = await authService.verifyEmailOtp(body);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.message || "Email verified successfully",
      ),
    );
});

export const resendEmailVerificationOtp = asyncHandler(async (req, res) => {
  const body = getValidatedBody(req);
  const result = await authService.resendEmailVerificationOtp(body);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.message || "Verification email sent successfully",
      ),
    );
});

export const login = asyncHandler(async (req, res) => {
  const body = getValidatedBody(req);

  const result = await authService.loginUser(body);

  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    result.tokens.refreshToken,
    getRefreshTokenCookieOptions(),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: result.user, accessToken: result.tokens.accessToken },
        result.message || "Login successful",
      ),
    );
});

export const getMe = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  const result = await authService.getCurrentUser(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.message || "Current user fetched successfully",
      ),
    );
});

export const logout = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  console.log(req.user);

  const result = await authService.logoutUser(userId);

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieOptions());

  return res
    .status(200)
    .json(new ApiResponse(200, result, result.message || "Logout successful"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const body = getValidatedBody(req);

  const result = await authService.forgotPassword(body);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.message || "Password reset link sent successfully",
      ),
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const body = getValidatedBody(req);

  const result = await authService.resetPassword(body);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.message || "Password reset successfully",
      ),
    );
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const body = getValidatedBody(req);

  const result = await authService.changePassword(userId, body);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.message || "Password changed successfully",
      ),
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const body = getValidatedBody(req);

  const result = await authService.refreshAccessToken(body);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.message || "Access token refreshed successfully",
      ),
    );
});
