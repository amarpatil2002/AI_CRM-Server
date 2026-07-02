const mongoose = require("mongoose");

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    // Multi Tenant
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // User who performed the action
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related Resources
    lead: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    deal: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    contact: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },

    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    meeting: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "LEAD_CREATED",
        "LEAD_UPDATED",
        "LEAD_ASSIGNED",
        "LEAD_STAGE_CHANGED",

        "DEAL_CREATED",
        "DEAL_UPDATED",
        "DEAL_WON",
        "DEAL_LOST",

        "CALL",
        "EMAIL",
        "SMS",
        "NOTE",

        "TASK_CREATED",
        "TASK_COMPLETED",

        "MEETING_CREATED",
        "MEETING_COMPLETED",

        "FILE_UPLOADED",

        "LOGIN",

        "OTHER",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    ipAddress: String,

    userAgent: String,

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

/* ===========================
   INDEXES
=========================== */

activitySchema.index({ organization: 1 });

activitySchema.index({ user: 1 });

activitySchema.index({ lead: 1 });

activitySchema.index({ deal: 1 });

activitySchema.index({ company: 1 });

activitySchema.index({ contact: 1 });

activitySchema.index({ task: 1 });

activitySchema.index({ meeting: 1 });

activitySchema.index({ type: 1 });

activitySchema.index({ createdAt: -1 });

/* ===========================
   QUERY MIDDLEWARE
=========================== */

activitySchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ===========================
   INSTANCE METHODS
=========================== */

activitySchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Activity", activitySchema);
