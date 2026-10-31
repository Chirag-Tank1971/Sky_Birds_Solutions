const mongoose = require("mongoose");

// Who changed what learners can see. Kept even if the lesson or module is later deleted.
const courseAuditSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    action: { type: String, required: true },
    targetType: { type: String, enum: ["course", "module", "lesson"], required: true },
    targetId: { type: String, default: "" },
    targetTitle: { type: String, default: "" },
    adminEmail: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

courseAuditSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model("CourseAudit", courseAuditSchema);
