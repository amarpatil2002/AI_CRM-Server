import mongoose from "mongoose";

const { Schema } = mongoose;

const organizationMemberSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
        required: true,
      },
    ],

    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },

    department: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },

    employeeId: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["INVITED", "ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    invitedAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },

    // ---------------- INVITE FLOW FIELDS ----------------
    inviteToken: {
      type: String,
      default: null,
      select: false,
      index: true,
    },

    inviteTokenExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    inviteAcceptedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * One user should have only one membership record per organization
 */
organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

/**
 * Helpful indexes
 */
organizationMemberSchema.index({ organization: 1, status: 1 });
organizationMemberSchema.index({ user: 1, status: 1 });
organizationMemberSchema.index({ organization: 1, roles: 1 });
organizationMemberSchema.index({ createdAt: -1 });

/**
 * Hide soft-deleted members from normal queries
 */
organizationMemberSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

/**
 * Soft delete helper
 */
organizationMemberSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

const OrganizationMember = mongoose.model(
  "OrganizationMember",
  organizationMemberSchema,
);

export default OrganizationMember;
