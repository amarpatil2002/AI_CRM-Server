import mongoose from "mongoose";
import * as yup from "yup";

const objectId = yup
  .string()
  .trim()
  .matches(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const listOrganizationMembersSchema = yup.object({
  query: yup.object({
    page: yup.number().integer().min(1).default(1),
    limit: yup.number().integer().min(1).max(100).default(10),
    search: yup.string().trim().optional(),
    status: yup
      .string()
      .oneOf(["INVITED", "ACTIVE", "INACTIVE", "SUSPENDED"])
      .optional(),
    roleId: objectId.optional(),
  }),
  params: yup.object({}),
  body: yup.object({}),
});

export const inviteOrganizationMemberSchema = yup.object({
  body: yup.object({
    firstName: yup.string().trim().required("First name is required"),
    lastName: yup.string().trim().required("Last name is required"),
    email: yup
      .string()
      .trim()
      .email("Valid email is required")
      .required("Email is required"),
    phone: yup.string().trim().nullable().optional(),
    role: yup.string().trim().required("Role are required"),
    title: yup.string().trim().nullable().optional(),
    department: yup.string().trim().nullable().optional(),
  }),
  params: yup.object({}),
  query: yup.object({}),
});

export const resendOrganizationMemberInviteSchema = yup.object({
  params: yup.object({
    memberId: yup
      .string()
      .required("Member id is required")
      .test(
        "is-object-id",
        "Member id must be a valid MongoDB ObjectId",
        (value) => mongoose.Types.ObjectId.isValid(value),
      ),
  }),
});

export const getInviteByTokenSchema = yup.object({
  params: yup.object({
    token: yup.string().trim().required("Invite token is required"),
  }),
});

export const acceptInviteSchema = yup.object({
  body: yup.object({
    token: yup.string().trim().required("Invite token is required"),
    password: yup
      .string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: yup
      .string()
      .required("Confirm password is required")
      .oneOf([yup.ref("password")], "Confirm password must match password"),
  }),
});

export const createOrganizationMemberSchema = yup.object({
  body: yup.object({
    firstName: yup.string().trim().required("First name is required"),
    lastName: yup.string().trim().required("Last name is required"),
    email: yup
      .string()
      .trim()
      .email("Valid email is required")
      .required("Email is required"),
    phone: yup.string().trim().nullable().optional(),
    role: yup.string().trim().required("Role are required"),
    title: yup.string().trim().nullable().optional(),
    department: yup.string().trim().nullable().optional(),
    employeeId: yup.string().trim().nullable().optional(),
  }),
  params: yup.object({}),
  query: yup.object({}),
});

export const getOrganizationMemberByIdSchema = yup.object({
  params: yup.object({
    memberId: objectId.required("memberId is required"),
  }),
  body: yup.object({}),
  query: yup.object({}),
});

export const updateOrganizationMemberSchema = yup.object({
  params: yup.object({
    memberId: objectId.required("memberId is required"),
  }),
  body: yup.object({
    firstName: yup.string().trim().optional(),
    lastName: yup.string().trim().optional(),
    phone: yup.string().trim().nullable().optional(),
    title: yup.string().trim().nullable().optional(),
    department: yup.string().trim().nullable().optional(),
    employeeId: yup.string().trim().nullable().optional(),
  }),
  query: yup.object({}),
});

export const updateOrganizationMemberRolesSchema = yup.object({
  params: yup.object({
    memberId: objectId.required("memberId is required"),
  }),
  body: yup.object({
    role: yup.string().trim().required("Role are required"),
  }),
  query: yup.object({}),
});

export const updateOrganizationMemberStatusSchema = yup.object({
  params: yup.object({
    memberId: objectId.required("memberId is required"),
  }),
  body: yup.object({
    status: yup
      .string()
      .oneOf(
        ["INVITED", "ACTIVE", "INACTIVE", "SUSPENDED"],
        "Invalid member status",
      )
      .required("Status is required"),
  }),
  query: yup.object({}),
});

export const deleteOrganizationMemberSchema = yup.object({
  params: yup.object({
    memberId: objectId.required("memberId is required"),
  }),
  body: yup.object({}),
  query: yup.object({}),
});
