const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // An account signs up with a mobile number or an email (or both); each is unique when present.
    mobile: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    // Collected at sign-up; empty on accounts created before these fields existed.
    age: {
      type: Number,
      min: 13,
      max: 100,
    },
    profession: {
      type: String,
      default: "",
      maxlength: 60,
    },
    passwordHash: {
      type: String,
      select: false,
      default: undefined, 
    },
    passwordResetJti: {
      type: String,
      select: false,
      default: undefined,
    },
    // Login tokens issued before this moment are rejected (set on password reset).
    passwordChangedAt: {
      type: Date,
      select: false,
      default: undefined,
    },
    // Set when an admin deletes the customer. The record is kept as a "past user": its mobile and
    // email move to pastMobile/pastEmail so the person can sign up again, and sign-in is refused.
    deletedAt: {
      type: Date,
      default: undefined,
    },
    pastMobile: {
      type: String,
      default: undefined,
    },
    pastEmail: {
      type: String,
      default: undefined,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    purchasedCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    role: {
      type: String,
      default: "customer",
    },
  },
  { timestamps: true }
);

// Partial indexes: unique only among accounts that have a non-empty value.
userSchema.index({ mobile: 1 }, { unique: true, partialFilterExpression: { mobile: { $gt: "" } } });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $gt: "" } } });

module.exports = mongoose.model("User", userSchema);
