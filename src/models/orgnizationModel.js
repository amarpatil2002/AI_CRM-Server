import mongoose from "mongoose";

const { Schema } = mongoose;

const organizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      default: null,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    industry: {
      type: String,
      trim: true,
      default: null,
    },

    description: {
      type: String,
      maxlength: 500,
      default: null,
    },

    address: {
      street: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, default: null },
      country: { type: String, trim: true, default: null },
      zipCode: { type: String, trim: true, default: null },
    },

    settings: {
      timezone: {
        type: String,
        default: "UTC",
      },
      language: {
        type: String,
        default: "en",
      },
      currency: {
        type: String,
        default: "USD",
      },
    },

    subscription: {
      plan: {
        type: String,
        enum: ["FREE", "STARTER", "PRO", "ENTERPRISE"],
        default: "FREE",
      },

      startsAt: {
        type: Date,
        default: Date.now,
      },

      expiresAt: {
        type: Date,
        default: null,
      },

      maxUsers: {
        type: Number,
        default: 5,
      },

      maxStorage: {
        type: Number,
        default: 1024,
      },
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ email: 1 });
organizationSchema.index({ owner: 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ createdAt: -1 });

organizationSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

organizationSchema.virtual("isPremium").get(function () {
  return this.subscription?.plan !== "FREE";
});

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
