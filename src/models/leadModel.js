const mongoose = require("mongoose");

const { Schema } = mongoose;

const leadSchema = new Schema(
  {
    // Multi Tenant
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Company
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    // Primary Contact
    contact: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },

    // Sales Person
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Pipeline
    pipeline: {
      type: Schema.Types.ObjectId,
      ref: "Pipeline",
      required: true,
    },

    // Current Stage
    stage: {
      type: Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
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
      maxlength: 2000,
    },

    source: {
      type: String,
      enum: [
        "Website",
        "Facebook",
        "Instagram",
        "LinkedIn",
        "Google Ads",
        "Email Campaign",
        "Referral",
        "Cold Call",
        "WhatsApp",
        "Manual",
        "Other",
      ],
      default: "Manual",
    },

    status: {
      type: String,
      enum: [
        "New",
        "Qualified",
        "Contacted",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
      ],
      default: "New",
      index: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    expectedRevenue: {
      type: Number,
      default: 0,
    },

    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    expectedCloseDate: Date,

    lostReason: String,

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],

    notes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Note",
      },
    ],

    activities: [
      {
        type: Schema.Types.ObjectId,
        ref: "Activity",
      },
    ],

    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

leadSchema.index({ organization: 1, status: 1 });

leadSchema.index({ owner: 1 });

leadSchema.index({ pipeline: 1 });

leadSchema.index({ stage: 1 });

leadSchema.index({ company: 1 });

leadSchema.index({ contact: 1 });

leadSchema.index({ expectedCloseDate: 1 });

leadSchema.index({ createdAt: -1 });

leadSchema.index({
  title: "text",
  description: "text",
});

/* ==========================
   QUERY MIDDLEWARE
========================== */

leadSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ==========================
   INSTANCE METHODS
========================== */

leadSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

leadSchema.methods.markWon = async function () {
  this.status = "Won";
  this.probability = 100;

  return this.save();
};

leadSchema.methods.markLost = async function (reason) {
  this.status = "Lost";
  this.probability = 0;
  this.lostReason = reason;

  return this.save();
};

leadSchema.methods.updateScore = async function (score) {
  this.score = score;

  return this.save();
};

/* ==========================
   VIRTUALS
========================== */

leadSchema.virtual("isClosed").get(function () {
  return ["Won", "Lost"].includes(this.status);
});

leadSchema.virtual("isHotLead").get(function () {
  return this.score >= 80;
});

module.exports = mongoose.model("Lead", leadSchema);
