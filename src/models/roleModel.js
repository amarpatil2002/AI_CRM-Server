import mongoose from "mongoose";
import { ACCESS_SCOPE } from "../utils/accessScope.js";

const roleScopeSchema = new mongoose.Schema(
  {
    lead: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    contact: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    account: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    deal: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    task: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    note: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    meeting: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    user: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
    report: {
      type: String,
      enum: Object.values(ACCESS_SCOPE),
      default: ACCESS_SCOPE.OWN,
    },
  },
  { _id: false },
);

const roleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    accessScope: {
      type: roleScopeSchema,
      default: () => ({}),
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

roleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Role = mongoose.model("Role", roleSchema);

export default Role;
