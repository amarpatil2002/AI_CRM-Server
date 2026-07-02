const mongoose = require("mongoose");

const { Schema } = mongoose;

const pipelineSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
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
      maxlength: 500,
    },

    type: {
      type: String,
      enum: ["Sales", "Marketing", "Recruitment", "Support", "Custom"],
      default: "Sales",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    color: {
      type: String,
      default: "#2563EB",
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

pipelineSchema.index(
  {
    organization: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

pipelineSchema.index({ status: 1 });

pipelineSchema.index({ createdAt: -1 });

/* ======================
   QUERY MIDDLEWARE
====================== */

pipelineSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* ======================
   METHODS
====================== */

pipelineSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Pipeline", pipelineSchema);
