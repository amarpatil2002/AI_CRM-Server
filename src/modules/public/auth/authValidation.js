import * as yup from "yup";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const registerSchema = yup.object({
  body: yup.object({
    fullName: yup
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters")
      .required("Full name is required"),

    email: yup
      .string()
      .trim()
      .lowercase()
      .email("Please provide a valid email address")
      .required("Email is required"),

    password: yup
      .string()
      .required("Password is required")
      .matches(
        PASSWORD_REGEX,
        "Password must be 8-64 characters and include uppercase, lowercase, number, and special character",
      ),

    organizationName: yup
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters")
      .max(120, "Organization name cannot exceed 120 characters")
      .required("Organization name is required"),
  }),
});

export const loginSchema = yup.object({
  body: yup.object({
    email: yup
      .string()
      .trim()
      .lowercase()
      .email("Please provide a valid email address")
      .required("Email is required"),

    password: yup.string().required("Password is required"),
  }),
});

export const forgotPasswordSchema = yup.object({
  body: yup.object({
    email: yup
      .string()
      .trim()
      .lowercase()
      .email("Please provide a valid email address")
      .required("Email is required"),
  }),
});

export const resetPasswordSchema = yup.object({
  body: yup.object({
    token: yup.string().trim().required("Reset token is required"),

    newPassword: yup
      .string()
      .required("New password is required")
      .matches(
        PASSWORD_REGEX,
        "New password must be 8-64 characters and include uppercase, lowercase, number, and special character",
      ),
  }),
});

export const changePasswordSchema = yup.object({
  body: yup.object({
    currentPassword: yup.string().required("Current password is required"),

    newPassword: yup
      .string()
      .required("New password is required")
      .matches(
        PASSWORD_REGEX,
        "New password must be 8-64 characters and include uppercase, lowercase, number, and special character",
      )
      .notOneOf(
        [yup.ref("currentPassword")],
        "New password must be different from current password",
      ),
  }),
});

export const authMeSchema = yup.object({
  params: yup.object({}),
  query: yup.object({}),
  body: yup.object({}),
});

export const userIdParamSchema = yup.object({
  params: yup.object({
    userId: yup.string().matches(objectIdRegex, "Invalid user id"),
  }),
});
