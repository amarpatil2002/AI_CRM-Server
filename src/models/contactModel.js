const mongoose = require("mongoose");

const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
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
        "Advertisement",
        "Manual",
        "Other",
      ],
      default: "Manual",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Customer", "Prospect"],
      default: "Prospect",
    },

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },

    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    notes: {
      type: String,
      maxlength: 2000,
    },

    lastContactedAt: {
      type: Date,
    },

    isFavorite: {
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

/* ===========================
   INDEXES
=========================== */

contactSchema.index({ organization: 1, email: 1 });

contactSchema.index({ organization: 1, company: 1 });

contactSchema.index({ owner: 1 });

contactSchema.index({ status: 1 });

contactSchema.index({ firstName: 1, lastName: 1 });

contactSchema.index({ createdAt: -1 });

/* ===========================
   QUERY MIDDLEWARE
=========================== */

contactSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

/* ===========================
   INSTANCE METHODS
=========================== */

contactSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

contactSchema.methods.fullName = function () {
  return `${this.firstName} ${this.lastName || ""}`.trim();
};

/* ===========================
   VIRTUAL
=========================== */

contactSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName || ""}`.trim();
});

module.exports = mongoose.model("Contact", contactSchema);
