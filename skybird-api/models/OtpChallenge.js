
const mongoose = require("mongoose");

const otpChallengeSchema = new mongoose.Schema(
  {
    // 10-digit mobile number or lowercase email the code was sent to.
    identifier: {
      type: String,
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["register", "reset", "link"],
      default: "register",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900,
    },
  },
  { versionKey: false }
);

// Partial so records written by older API versions (without identifier) never collide.
otpChallengeSchema.index({ identifier: 1 }, { unique: true, partialFilterExpression: { identifier: { $gt: "" } } });

module.exports = mongoose.model("OtpChallenge", otpChallengeSchema);
