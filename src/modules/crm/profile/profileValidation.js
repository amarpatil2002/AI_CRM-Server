import * as yup from "yup";

export const updateProfileSchema = yup.object({
  body: yup.object({
    firstName: yup.string().trim().required("First name is required"),
    lastName: yup.string().trim().required("Last name is required"),
    phone: yup.string().trim().nullable().optional(),
  }),
});
