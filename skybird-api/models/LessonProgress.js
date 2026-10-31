const mongoose = require("mongoose");

// Where a customer got to in one lesson. Lessons have string ids inside course.videos.
const lessonProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: String, required: true },
    position: { type: Number, default: 0, min: 0 },
    duration: { type: Number, default: 0, min: 0 },
    // Stays true once reached, even if the lesson is rewatched.
    completed: { type: Boolean, default: false },
    lastWatchedAt: { type: Date, default: Date.now },
  }
);

lessonProgressSchema.index({ user: 1, course: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ user: 1, lastWatchedAt: -1 });

module.exports = mongoose.model("LessonProgress", lessonProgressSchema);
