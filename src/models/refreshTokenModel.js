const mongoose = require("mongoose");
const crypto = require("crypto");

const refreshTokenSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },

    deviceName: {
      type: String,
      default: "Unknown Device",
    },

    deviceType: {
      type: String,
      enum: ["WEB", "ANDROID", "IOS", "DESKTOP"],
      default: "WEB",
    },

    browser: String,

    operatingSystem: String,

    ipAddress: String,

    userAgent: String,

    isRevoked: {
      type: Boolean,
      default: false,
    },

    revokedAt: Date,

    expiresAt: {
      type: Date,
      required: true,
      index: true,
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

refreshTokenSchema.index({
  user: 1,
  isRevoked: 1,
});

refreshTokenSchema.index({
  expiresAt: 1,
});

/* ======================
   TTL INDEX
====================== */

refreshTokenSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

/* ======================
   METHODS
====================== */

refreshTokenSchema.methods.revoke = async function () {
  this.isRevoked = true;
  this.revokedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
