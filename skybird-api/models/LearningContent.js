const mongoose = require("mongoose");

const CONTENT_TYPES = ["session", "resource", "community", "reward"];

// What admins publish to the student dashboard: live sessions, resources, communities and rewards.
const learningContentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: CONTENT_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    url: { type: String, trim: true, default: "", maxlength: 1000 },
    thumbnail: { type: String, trim: true, default: "", maxlength: 1000 },
    // Empty = every logged-in student; set = only buyers of this course.
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    isPublished: { type: Boolean, default: false },
    // Live sessions only.
    startsAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: 60, min: 1, max: 1440 },
    recordingUrl: { type: String, trim: true, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

learningContentSchema.index({ type: 1, isPublished: 1, course: 1 });

module.exports = mongoose.model("LearningContent", learningContentSchema);
module.exports.CONTENT_TYPES = CONTENT_TYPES;
