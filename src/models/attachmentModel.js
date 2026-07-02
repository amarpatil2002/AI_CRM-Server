const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    // Multi Tenant
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // User who uploaded the file
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related Resources
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

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },

    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
      unique: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    extension: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    provider: {
      type: String,
      enum: ["CLOUDINARY", "AWS_S3", "LOCAL"],
      default: "CLOUDINARY",
    },

    folder: {
      type: String,
      default: "crm",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      trim: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
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

attachmentSchema.index({ organization: 1 });

attachmentSchema.index({ uploadedBy: 1 });

attachmentSchema.index({ lead: 1 });

attachmentSchema.index({ deal: 1 });

attachmentSchema.index({ company: 1 });

attachmentSchema.index({ contact: 1 });

attachmentSchema.index({ task: 1 });

attachmentSchema.index({ meeting: 1 });

attachmentSchema.index({ note: 1 });

attachmentSchema.index({ createdAt: -1 });

attachmentSchema.index({ publicId: 1 });

/* ==========================
   QUERY MIDDLEWARE
========================== */

attachmentSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ==========================
   METHODS
========================== */

attachmentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Attachment", attachmentSchema);
