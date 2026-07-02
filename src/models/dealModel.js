const mongoose = require("mongoose");

const { Schema } = mongoose;

const dealSchema = new Schema(
  {
    // Multi Tenant
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Converted From Lead
    lead: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    contact: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    pipeline: {
      type: Schema.Types.ObjectId,
      ref: "Pipeline",
      required: true,
      index: true,
    },

    stage: {
      type: Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
      index: true,
    },

    dealNumber: {
      type: String,
      unique: true,
      index: true,
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
    },

    value: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    expectedCloseDate: {
      type: Date,
    },

    actualCloseDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["OPEN", "WON", "LOST", "ON_HOLD"],
      default: "OPEN",
      index: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    source: {
      type: String,
      enum: [
        "Website",
        "Facebook",
        "Instagram",
        "LinkedIn",
        "Referral",
        "Email Campaign",
        "Cold Call",
        "Manual",
        "Other",
      ],
      default: "Manual",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    lostReason: {
      type: String,
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

dealSchema.index({ organization: 1, owner: 1 });

dealSchema.index({ pipeline: 1, stage: 1 });

dealSchema.index({ company: 1 });

dealSchema.index({ contact: 1 });

dealSchema.index({ expectedCloseDate: 1 });

dealSchema.index({ createdAt: -1 });

dealSchema.index({
  title: "text",
  description: "text",
});

/* ==========================
   QUERY MIDDLEWARE
========================== */

dealSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ==========================
   AUTO DEAL NUMBER
========================== */

dealSchema.pre("save", async function (next) {
  if (!this.isNew || this.dealNumber) return next();

  const count = await mongoose.model("Deal").countDocuments();

  this.dealNumber = `DL-${String(count + 1).padStart(6, "0")}`;

  next();
});

/* ==========================
   INSTANCE METHODS
========================== */

dealSchema.methods.markWon = async function () {
  this.status = "WON";
  this.actualCloseDate = new Date();
  this.probability = 100;

  return this.save();
};

dealSchema.methods.markLost = async function (reason) {
  this.status = "LOST";
  this.actualCloseDate = new Date();
  this.probability = 0;
  this.lostReason = reason;

  return this.save();
};

dealSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

/* ==========================
   VIRTUALS
========================== */

dealSchema.virtual("expectedRevenue").get(function () {
  return (this.value * this.probability) / 100;
});

dealSchema.virtual("isClosed").get(function () {
  return ["WON", "LOST"].includes(this.status);
});

module.exports = mongoose.model("Deal", dealSchema);
