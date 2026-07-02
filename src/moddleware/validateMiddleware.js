import ApiError from "../utils/ApiError.js";

const validate = (schema) => async (req, res, next) => {
  try {
    const validatedData = await schema.validate(
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
      {
        abortEarly: false,
        stripUnknown: true,
      },
    );

    req.body = validatedData.body || req.body;
    req.params = validatedData.params || req.params;
    req.query = validatedData.query || req.query;

    next();
  } catch (error) {
    return next(
      new ApiError(400, "Validation failed", error.errors || [error.message]),
    );
  }
};

export default validate;
