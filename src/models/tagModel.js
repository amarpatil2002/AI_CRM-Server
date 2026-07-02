const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    // Multi Tenant
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    color: {
      type: String,
      default: "#3B82F6",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    module: {
      type: [String],
      enum: ["Lead", "Deal", "Company", "Contact", "Task", "Meeting", "Note"],
      required: true,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
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

tagSchema.index(
  {
    organization: 1,
    slug: 1,
  },
  {
    unique: true,
  },
);

tagSchema.index({
  status: 1,
});

tagSchema.index({
  createdAt: -1,
});

/* ==========================
   QUERY MIDDLEWARE
========================== */

tagSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ==========================
   SLUG GENERATION
========================== */

tagSchema.pre("save", function (next) {
  if (!this.isModified("name")) return next();

  this.slug = this.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  next();
});

/* ==========================
   METHODS
========================== */

tagSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Tag", tagSchema);
