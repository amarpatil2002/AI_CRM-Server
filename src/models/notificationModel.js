const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Multi Tenant
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Recipient
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Sender (Optional)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        "INFO",
        "SUCCESS",
        "WARNING",
        "ERROR",
        "TASK",
        "MEETING",
        "LEAD",
        "DEAL",
        "SYSTEM",
      ],
      default: "INFO",
      index: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    relatedTo: {
      entityType: {
        type: String,
        enum: ["Lead", "Deal", "Company", "Contact", "Task", "Meeting", "Note"],
      },

      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    channels: [
      {
        type: String,
        enum: ["IN_APP", "EMAIL", "PUSH"],
      },
    ],

    actionUrl: {
      type: String,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
    },

    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ==========================
   INDEXES
========================== */

notificationSchema.index({
  organization: 1,
  recipient: 1,
});

notificationSchema.index({
  recipient: 1,
  isRead: 1,
});

notificationSchema.index({
  type: 1,
});

notificationSchema.index({
  createdAt: -1,
});

/* ==========================
   QUERY MIDDLEWARE
========================== */

notificationSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ==========================
   METHODS
========================== */

notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();

  return this.save();
};

notificationSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Notification", notificationSchema);
