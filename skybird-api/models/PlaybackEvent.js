const mongoose = require("mongoose");

// Private record of each authorized lesson, used to trace a leaked recording from its watermark code.
// Kept for 90 days. Never logged or shown to customers.
const playbackEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lessonId: { type: String, default: "" },
  code: { type: String, required: true },
  userAgent: { type: String, default: "", maxlength: 160 },
  createdAt: { type: Date, default: Date.now },
});

playbackEventSchema.index({ code: 1, createdAt: -1 });
playbackEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("PlaybackEvent", playbackEventSchema);
