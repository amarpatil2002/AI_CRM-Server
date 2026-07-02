const mongoose = require("mongoose");

const { Schema } = mongoose;

const meetingSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    lead: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    deal: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    contact: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },

    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    meetingType: {
      type: String,
      enum: ["ONLINE", "OFFLINE", "PHONE"],
      default: "ONLINE",
    },

    meetingProvider: {
      type: String,
      enum: ["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS", "OTHER"],
      default: "GOOGLE_MEET",
    },

    meetingLink: String,

    location: String,

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },

    agenda: String,

    outcome: String,

    recordingUrl: String,

    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],

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

    deletedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* INDEXES */

meetingSchema.index({
  organization: 1,
  organizer: 1,
});

meetingSchema.index({
  startTime: 1,
});

meetingSchema.index({
  lead: 1,
});

meetingSchema.index({
  deal: 1,
});

/* QUERY MIDDLEWARE */

meetingSchema.pre(/^find/, function (next) {
  this.where({
    isDeleted: false,
  });

  next();
});

/* METHODS */

meetingSchema.methods.complete = async function () {
  this.status = "COMPLETED";

  return this.save();
};

meetingSchema.methods.cancel = async function () {
  this.status = "CANCELLED";

  return this.save();
};

meetingSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();

  return this.save();
};

module.exports = mongoose.model("Meeting", meetingSchema);
