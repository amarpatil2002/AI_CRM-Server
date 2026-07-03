import ApiError from "../utils/apiError.js";

const validate = (schema) => async (req, res, next) => {
  try {
    const validated = await schema.validate(
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

    req.validated = validated;

    next();
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(
        new ApiError(
          400,
          "Validation failed",
          error.inner?.length
            ? error.inner.map((err) => ({
                field: err.path,
                message: err.message,
              }))
            : [{ field: error.path, message: error.message }],
        ),
      );
    }

    next(error);
  }
};

export default validate;
