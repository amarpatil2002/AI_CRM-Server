const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "EXPORT",
        "IMPORT",
        "ASSIGN",
        "STATUS_CHANGE",
        "ROLE_CHANGE",
        "PASSWORD_CHANGE",
      ],
    },

    entityType: {
      type: String,
      required: true,
      enum: [
        "User",
        "Lead",
        "Deal",
        "Company",
        "Contact",
        "Task",
        "Meeting",
        "Role",
        "Organization",
      ],
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    oldData: {
      type: mongoose.Schema.Types.Mixed,
    },

    newData: {
      type: mongoose.Schema.Types.Mixed,
    },

    ipAddress: String,

    userAgent: String,

    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* INDEXES */

auditLogSchema.index({
  organization: 1,
  createdAt: -1,
});

auditLogSchema.index({
  entityType: 1,
  entityId: 1,
});

auditLogSchema.index({
  action: 1,
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
