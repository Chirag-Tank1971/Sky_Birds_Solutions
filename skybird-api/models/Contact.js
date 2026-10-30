const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      maxlength: 254,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
    },
    notes: {
      type: String,
      default: "",
      maxlength: 10000,
    },
  },
  { timestamps: true }
);

// Admin inbox: filtered by status and/or listed newest first.
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Contact", contactSchema);
