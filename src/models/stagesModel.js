const mongoose = require("mongoose");

const { Schema } = mongoose;

const stageSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    pipeline: {
      type: Schema.Types.ObjectId,
      ref: "Pipeline",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    color: {
      type: String,
      default: "#0EA5E9",
    },

    isWonStage: {
      type: Boolean,
      default: false,
    },

    isLostStage: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
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

stageSchema.index({
  organization: 1,
});

stageSchema.index({
  pipeline: 1,
});

stageSchema.index(
  {
    pipeline: 1,
    order: 1,
  },
  {
    unique: true,
  },
);

stageSchema.index(
  {
    pipeline: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

/* ======================
   QUERY MIDDLEWARE
====================== */

stageSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ======================
   METHODS
====================== */

stageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Stage", stageSchema);
