// Safe course changes: conflicting saves are retried on fresh data instead of overwriting each other.
const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseAudit = require("../models/CourseAudit");

class CourseEditError extends Error {
  constructor(statusCode, message, extra) {
    super(message);
    this.statusCode = statusCode;
    this.extra = extra;
  }
}

const findCourse = async (idOrObjectId) => {
  const id = String(idOrObjectId || "");
  return (await Course.findOne({ id })) || (/^[a-f\d]{24}$/i.test(id) ? await Course.findById(id) : null);
};

// Loads the course, applies `mutate`, and saves. On a version conflict it retries once from fresh data,
// so `mutate` must make its checks inside and be safe to run twice.
async function editCourse(idOrObjectId, mutate) {
  for (let attempt = 0; ; attempt += 1) {
    const course = await findCourse(idOrObjectId);
    if (!course) throw new CourseEditError(404, "Course not found");
    const result = await mutate(course);
    try {
      await course.save();
      return { course, result };
    } catch (error) {
      if (!(error instanceof mongoose.Error.VersionError)) throw error;
      if (attempt >= 1) throw new CourseEditError(409, "This course was changed elsewhere. Please refresh and try again.");
    }
  }
}

function sendEditError(res, error, label, fallback) {
  if (error instanceof CourseEditError) {
    return res.status(error.statusCode).json({ success: false, message: error.message, ...(error.extra || {}) });
  }
  console.error(`${label}:`, error.message);
  return res.status(500).json({ success: false, message: fallback });
}

// Never fails the change it describes.
async function recordAudit(req, course, action, targetType, target = {}) {
  try {
    await CourseAudit.create({
      course: course._id,
      action,
      targetType,
      targetId: target.id || "",
      targetTitle: target.title || "",
      adminEmail: req.admin?.email || "",
    });
  } catch (error) {
    console.error("Course audit failed:", error.message);
  }
}

module.exports = { CourseEditError, findCourse, editCourse, sendEditError, recordAudit };
