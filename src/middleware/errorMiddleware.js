import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  // Log error details
  console.error("API Error:", {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    userId: req.user?._id || null,
    body: req.body,
    params: req.params,
    query: req.query,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    data: null,
  });
};

export default errorHandler;
