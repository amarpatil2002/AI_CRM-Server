import * as yup from "yup";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const emptyObjectSchema = yup.object({}).default({});

export const registerSchema = yup.object({
  body: yup.object({
    firstName: yup
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters")
      .required("First name is required"),

    lastName: yup
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters")
      .required("Last name is required"),

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

    phone: yup.string().trim().nullable().notRequired(),
  }),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
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
  params: emptyObjectSchema,
  query: emptyObjectSchema,
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
  params: emptyObjectSchema,
  query: emptyObjectSchema,
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
  params: emptyObjectSchema,
  query: emptyObjectSchema,
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
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const authMeSchema = yup.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const userIdParamSchema = yup.object({
  params: yup.object({
    userId: yup
      .string()
      .required("User id is required")
      .matches(objectIdRegex, "Invalid user id"),
  }),
  body: emptyObjectSchema,
  query: emptyObjectSchema,
});
