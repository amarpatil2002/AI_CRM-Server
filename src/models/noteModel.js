const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // Multi Tenant
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Author
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related Entities
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

    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },

    type: {
      type: String,
      enum: ["GENERAL", "CALL", "EMAIL", "MEETING", "FOLLOW_UP", "INTERNAL"],
      default: "GENERAL",
    },

    visibility: {
      type: String,
      enum: ["PRIVATE", "TEAM"],
      default: "TEAM",
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

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

/* ======================
   INDEXES
====================== */

noteSchema.index({ organization: 1 });

noteSchema.index({ user: 1 });

noteSchema.index({ lead: 1 });

noteSchema.index({ deal: 1 });

noteSchema.index({ company: 1 });

noteSchema.index({ contact: 1 });

noteSchema.index({ meeting: 1 });

noteSchema.index({ createdAt: -1 });

noteSchema.index({
  title: "text",
  content: "text",
});

/* ======================
   QUERY MIDDLEWARE
====================== */

noteSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ======================
   INSTANCE METHODS
====================== */

noteSchema.methods.pin = async function () {
  this.isPinned = true;
  return this.save();
};

noteSchema.methods.unpin = async function () {
  this.isPinned = false;
  return this.save();
};

noteSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Note", noteSchema);
