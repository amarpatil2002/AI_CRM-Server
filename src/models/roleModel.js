import mongoose from "mongoose";

const { Schema } = mongoose;

const ACCESS_SCOPE_ENUM = ["OWN", "TEAM", "ALL"];

const roleSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      maxlength: 100,
    },

    code: {
      type: String,
      required: [true, "Role code is required"],
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: [
        /^[a-z0-9_]+$/,
        "Role code can only contain lowercase letters, numbers, and underscores",
      ],
    },

    description: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },

    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    accessScope: {
      lead: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      contact: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      account: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      deal: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      task: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      note: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      meeting: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      user: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
      report: {
        type: String,
        enum: ACCESS_SCOPE_ENUM,
        default: "OWN",
      },
    },

    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    priority: {
      type: Number,
      default: 0,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
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

roleSchema.index(
  { organization: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

roleSchema.index(
  { organization: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

roleSchema.index({ organization: 1, status: 1 });
roleSchema.index({ organization: 1, isDefault: 1 });
roleSchema.index({ organization: 1, priority: -1 });

roleSchema.pre(/^find/, function () {
  this.where({ isDeleted: false });
});

roleSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

const Role = mongoose.model("Role", roleSchema);

export default Role;
