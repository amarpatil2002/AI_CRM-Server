const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    // Multi Tenant
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // User who sent the email
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related CRM Records
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },

    // Email Information
    from: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    to: [
      {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    ],

    cc: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    bcc: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    html: {
      type: String,
      required: true,
    },

    text: {
      type: String,
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        size: Number,
        mimeType: String,
      },
    ],

    provider: {
      type: String,
      enum: ["SMTP", "GMAIL", "SENDGRID", "MAILGUN", "AWS_SES", "RESEND"],
      default: "SMTP",
    },

    providerMessageId: {
      type: String,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "QUEUED",
        "SENT",
        "DELIVERED",
        "OPENED",
        "CLICKED",
        "FAILED",
        "BOUNCED",
        "SPAM",
      ],
      default: "QUEUED",
      index: true,
    },

    errorMessage: {
      type: String,
    },

    sentAt: Date,

    deliveredAt: Date,

    openedAt: Date,

    clickedAt: Date,

    failedAt: Date,

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

emailLogSchema.index({
  organization: 1,
  sentBy: 1,
});

emailLogSchema.index({
  lead: 1,
});

emailLogSchema.index({
  deal: 1,
});

emailLogSchema.index({
  company: 1,
});

emailLogSchema.index({
  contact: 1,
});

emailLogSchema.index({
  status: 1,
});

emailLogSchema.index({
  sentAt: -1,
});

emailLogSchema.index({
  providerMessageId: 1,
});

/* ==========================
   QUERY MIDDLEWARE
========================== */

emailLogSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ==========================
   METHODS
========================== */

emailLogSchema.methods.markSent = async function () {
  this.status = "SENT";
  this.sentAt = new Date();

  return this.save();
};

emailLogSchema.methods.markDelivered = async function () {
  this.status = "DELIVERED";
  this.deliveredAt = new Date();

  return this.save();
};

emailLogSchema.methods.markOpened = async function () {
  this.status = "OPENED";
  this.openedAt = new Date();

  return this.save();
};

emailLogSchema.methods.markClicked = async function () {
  this.status = "CLICKED";
  this.clickedAt = new Date();

  return this.save();
};

emailLogSchema.methods.markFailed = async function (error) {
  this.status = "FAILED";
  this.failedAt = new Date();
  this.errorMessage = error;

  return this.save();
};

emailLogSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("EmailLog", emailLogSchema);
