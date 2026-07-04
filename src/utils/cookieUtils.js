export const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge:
      Number(process.env.REFRESH_TOKEN_COOKIE_MAX_AGE_MS) ||
      7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
};
