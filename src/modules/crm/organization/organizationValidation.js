import * as yup from "yup";

const emptyToNull = (value, originalValue) => {
  if (originalValue === "") return null;
  return value;
};

const optionalTrimmedString = (max, label) =>
  yup
    .string()
    .transform((value, originalValue) => {
      if (originalValue === undefined) return undefined;
      if (originalValue === null) return null;
      return typeof originalValue === "string"
        ? originalValue.trim()
        : originalValue;
    })
    .nullable()
    .max(max, `${label} must be at most ${max} characters`);

export const updateMyOrganizationSchema = yup
  .object({
    name: yup
      .string()
      .transform((value, originalValue) => {
        if (originalValue === undefined) return undefined;
        return typeof originalValue === "string"
          ? originalValue.trim()
          : originalValue;
      })
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name must be at most 100 characters")
      .optional(),

    logo: yup
      .string()
      .transform(emptyToNull)
      .trim()
      .nullable()
      .url("Logo must be a valid URL")
      .optional(),

    website: yup
      .string()
      .transform(emptyToNull)
      .trim()
      .nullable()
      .url("Website must be a valid URL")
      .optional(),

    email: yup
      .string()
      .transform((value, originalValue) => {
        if (originalValue === undefined) return undefined;
        if (originalValue === "") return null;
        return typeof originalValue === "string"
          ? originalValue.trim().toLowerCase()
          : originalValue;
      })
      .nullable()
      .email("Email must be valid")
      .optional(),

    phone: optionalTrimmedString(30, "Phone").optional(),

    industry: optionalTrimmedString(100, "Industry").optional(),

    description: optionalTrimmedString(500, "Description").optional(),

    address: yup
      .object({
        street: optionalTrimmedString(150, "Street").optional(),
        city: optionalTrimmedString(100, "City").optional(),
        state: optionalTrimmedString(100, "State").optional(),
        country: optionalTrimmedString(100, "Country").optional(),
        zipCode: optionalTrimmedString(20, "Zip code").optional(),
      })
      .optional(),

    settings: yup
      .object({
        timezone: optionalTrimmedString(100, "Timezone").optional(),
        language: optionalTrimmedString(20, "Language").optional(),
        currency: optionalTrimmedString(20, "Currency").optional(),
      })
      .optional(),
  })
  .test(
    "at-least-one-field",
    "At least one field is required to update organization",
    (value) => {
      if (!value || typeof value !== "object") return false;
      return Object.keys(value).length > 0;
    },
  )
  .noUnknown(true, "Unknown field: ${unknown}");
