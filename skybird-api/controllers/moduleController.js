const crypto = require("crypto");
const CourseAudit = require("../models/CourseAudit");
const Course = require("../models/Course");
const bunnyStream = require("../services/bunnyStream");
const { CourseEditError, findCourse, editCourse, sendEditError, recordAudit } = require("../services/courseEditing");
const { hasPlayableLesson } = require("../services/courseContent");
const { checkVideos, mapLimit } = require("../services/videoReadiness");
const { validateVideoId } = require("../services/videoService");

const newModuleId = () => `mod-${crypto.randomUUID().slice(0, 8)}`;
const newLessonId = () => `vid-${crypto.randomUUID().slice(0, 8)}`;

const MAX_BULK_FILES = 50;
const MAX_STATUS_IDS = 50;
const BULK_CREATE_CONCURRENCY = 5;
const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024;
const maxUploadBytes = () => Number(process.env.BUNNY_MAX_UPLOAD_BYTES) || DEFAULT_MAX_UPLOAD_BYTES;

const STATE_LABELS = {
  processing: "still processing",
  not_uploaded: "upload incomplete",
  failed: "video failed",
  missing: "no video",
  unknown: "couldn't be checked",
};

const cleanText = (value, max) => String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);

const getModule = (course, moduleId) => {
  const item = (course.modules || []).find((entry) => entry.id === moduleId);
  if (!item) throw new CourseEditError(404, "Module not found");
  return item;
};

const assertStillPlayable = (course) => {
  if (["live", "private"].includes(Course.statusOf(course)) && !hasPlayableLesson(course)) {
    throw new CourseEditError(400, "A live course needs at least one published lesson. Make the course unlive or upcoming first.");
  }
};

exports.createModule = async (req, res) => {
  try {
    const title = cleanText(req.body?.title, 200);
    if (!title) throw new CourseEditError(400, "Module title is required");
    const description = cleanText(req.body?.description, 1000);
    const moduleId = newModuleId();
    const { course } = await editCourse(req.params.id, (doc) => {
      // New modules always start locked; publishing is a separate, deliberate step.
      doc.modules.push({ id: moduleId, title, description, upcoming: true });
    });
    return res.status(201).json({ success: true, message: "Module added", data: course });
  } catch (error) {
    return sendEditError(res, error, "Create module failed", "Unable to add the module");
  }
};

exports.updateModule = async (req, res) => {
  try {
    const { course } = await editCourse(req.params.id, (doc) => {
      const item = getModule(doc, req.params.moduleId);
      if (req.body?.title !== undefined) {
        const title = cleanText(req.body.title, 200);
        if (!title) throw new CourseEditError(400, "Module title is required");
        item.title = title;
      }
      if (req.body?.description !== undefined) item.description = cleanText(req.body.description, 1000);
    });
    return res.status(200).json({ success: true, message: "Module updated", data: course });
  } catch (error) {
    return sendEditError(res, error, "Update module failed", "Unable to update the module");
  }
};

exports.deleteModule = async (req, res) => {
  try {
    let removed;
    const { course } = await editCourse(req.params.id, (doc) => {
      removed = getModule(doc, req.params.moduleId);
      if (doc.videos.some((lesson) => lesson.moduleId === removed.id)) {
        throw new CourseEditError(409, "Move or delete this module's lessons first.");
      }
      doc.modules = doc.modules.filter((entry) => entry.id !== removed.id);
    });
    await recordAudit(req, course, "module_deleted", "module", removed);
    return res.status(200).json({ success: true, message: "Module deleted", data: course });
  } catch (error) {
    return sendEditError(res, error, "Delete module failed", "Unable to delete the module");
  }
};

exports.reorderModules = async (req, res) => {
  try {
    const order = Array.isArray(req.body?.order) ? req.body.order.map(String) : null;
    const { course } = await editCourse(req.params.id, (doc) => {
      const ids = doc.modules.map((entry) => entry.id);
      if (!order || order.length !== ids.length || new Set(order).size !== ids.length || order.some((id) => !ids.includes(id))) {
        throw new CourseEditError(400, "The new order must list every module exactly once");
      }
      doc.modules = order.map((id) => doc.modules.find((entry) => entry.id === id));
    });
    return res.status(200).json({ success: true, message: "Modules reordered", data: course });
  } catch (error) {
    return sendEditError(res, error, "Reorder modules failed", "Unable to reorder modules");
  }
};

// Publishes the whole module, or nothing: every lesson's video is re-checked at click time.
exports.publishModule = async (req, res) => {
  try {
    let published;
    const { course } = await editCourse(req.params.id, async (doc) => {
      published = getModule(doc, req.params.moduleId);
      const lessons = doc.videos.filter((lesson) => lesson.moduleId === published.id);
      if (lessons.length === 0) throw new CourseEditError(409, "Add lessons to this module before publishing it.");

      const checks = await checkVideos(lessons);
      if (checks.some((check) => check.state === "unknown")) {
        throw new CourseEditError(503, "Couldn't confirm all lessons with the video service. Please retry.");
      }
      const blocked = lessons
        .map((lesson, index) => ({ id: lesson.id, title: lesson.title, state: checks[index].state, progress: checks[index].progress }))
        .filter((entry) => entry.state !== "ready");
      if (blocked.length) {
        const summary = blocked.slice(0, 3).map((entry) => `"${entry.title}" ${STATE_LABELS[entry.state] || entry.state}`).join(", ");
        throw new CourseEditError(
          409,
          `${blocked.length} of ${lessons.length} lessons aren't ready: ${summary}${blocked.length > 3 ? "…" : ""}`,
          { lessons: blocked }
        );
      }

      published.upcoming = false;
      lessons.forEach((lesson) => { lesson.upcoming = false; });
    });
    await recordAudit(req, course, "module_published", "module", published);
    return res.status(200).json({ success: true, message: "Module published", data: course });
  } catch (error) {
    return sendEditError(res, error, "Publish module failed", "Unable to publish the module");
  }
};

exports.unpublishModule = async (req, res) => {
  try {
    let target;
    const { course } = await editCourse(req.params.id, (doc) => {
      target = getModule(doc, req.params.moduleId);
      target.upcoming = true;
      assertStillPlayable(doc);
    });
    await recordAudit(req, course, "module_unpublished", "module", target);
    return res.status(200).json({ success: true, message: "Module unpublished", data: course });
  } catch (error) {
    return sendEditError(res, error, "Unpublish module failed", "Unable to unpublish the module");
  }
};

// Creates a Bunny video and a saved (locked) lesson per file, in order, and returns one signed upload each.
// Lessons exist before uploading starts, so a refresh can't lose them. All or nothing.
exports.createBulkLessons = async (req, res) => {
  const created = [];
  try {
    if (!bunnyStream.isConfigured()) throw new CourseEditError(503, "Bunny Stream is not configured on the server");
    const items = Array.isArray(req.body?.lessons) ? req.body.lessons : null;
    if (!items || items.length === 0) throw new CourseEditError(400, "Add at least one video");
    if (items.length > MAX_BULK_FILES) throw new CourseEditError(400, `You can upload up to ${MAX_BULK_FILES} videos at a time`);

    const limit = maxUploadBytes();
    const lessons = items.map((item) => {
      const title = cleanText(item?.title, 200);
      const size = Number(item?.size);
      if (!title) throw new CourseEditError(400, "Every lesson needs a title");
      if (!Number.isFinite(size) || size <= 0) throw new CourseEditError(400, `"${title}" has an invalid file size`);
      if (size > limit) throw new CourseEditError(400, `"${title}" is larger than the ${Math.floor(limit / (1024 * 1024 * 1024))} GB limit`);
      return { title };
    });

    const snapshot = await findCourse(req.params.id);
    if (!snapshot) throw new CourseEditError(404, "Course not found");
    getModule(snapshot, req.params.moduleId);

    const uploads = await mapLimit(lessons, BULK_CREATE_CONCURRENCY, async (lesson) => {
      const upload = await bunnyStream.createUpload(lesson.title);
      created.push(upload.videoId);
      return upload;
    }).catch((error) => {
      if (error.statusCode) throw new CourseEditError(error.statusCode >= 500 ? 503 : error.statusCode, "The video service couldn't create the uploads. Please retry.");
      throw error;
    });

    const now = new Date();
    const lessonIds = lessons.map(() => newLessonId());
    const { course } = await editCourse(req.params.id, (doc) => {
      getModule(doc, req.params.moduleId);
      lessons.forEach((lesson, index) => {
        doc.videos.push({
          id: lessonIds[index],
          title: lesson.title,
          duration: "",
          videoId: uploads[index].videoId,
          provider: "bunny",
          moduleId: req.params.moduleId,
          upcoming: true,
          processingSince: now,
          link: "",
        });
      });
      doc.lessons = doc.videos.length;
    });

    return res.status(201).json({
      success: true,
      message: `${lessons.length} lessons created`,
      data: course,
      uploads: uploads.map((upload, index) => ({ lessonId: lessonIds[index], ...upload })),
    });
  } catch (error) {
    await Promise.all(created.map((videoId) =>
      bunnyStream.deleteVideo(videoId).catch((err) => console.error("Bulk upload cleanup failed:", err.message))
    ));
    return sendEditError(res, error, "Bulk lesson creation failed", "Unable to create the lessons");
  }
};

// One request for many videos, so polling a whole module stays within the API's rate limits.
exports.getBunnyVideoStatuses = async (req, res) => {
  try {
    if (!bunnyStream.isConfigured()) throw new CourseEditError(503, "Bunny Stream is not configured on the server");
    const ids = Array.isArray(req.body?.ids) ? [...new Set(req.body.ids.map(String))] : null;
    if (!ids || ids.length > MAX_STATUS_IDS || ids.some((id) => !validateVideoId(id))) {
      throw new CourseEditError(400, `Send up to ${MAX_STATUS_IDS} valid video ids`);
    }
    const data = {};
    await mapLimit(ids, BULK_CREATE_CONCURRENCY, async (id) => {
      try {
        data[id] = await bunnyStream.getStatus(id);
      } catch (error) {
        // Left out: the page keeps its last known state, except for a video Bunny no longer has.
        if (error.statusCode === 404) data[id] = { status: "failed", rawStatus: 6, progress: 0, durationSeconds: 0 };
      }
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendEditError(res, error, "Video status check failed", "Unable to check video status");
  }
};

// Fresh signature to continue an interrupted upload, only for a lesson's video Bunny hasn't received.
exports.signBunnyUpload = async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!bunnyStream.isConfigured()) throw new CourseEditError(503, "Bunny Stream is not configured on the server");
    if (!validateVideoId(videoId) || !(await Course.exists({ videos: { $elemMatch: { videoId, provider: "bunny" } } }))) {
      throw new CourseEditError(404, "Video not found");
    }
    const status = await bunnyStream.getStatus(videoId).catch((error) => {
      throw new CourseEditError(error.statusCode === 404 ? 404 : 503, error.statusCode === 404 ? "Video not found" : "Video service is unreachable. Please try again.");
    });
    if (status.rawStatus !== 0) throw new CourseEditError(409, "This video has already been uploaded.");
    return res.status(200).json({ success: true, videoId, ...bunnyStream.signUpload(videoId) });
  } catch (error) {
    return sendEditError(res, error, "Sign upload failed", "Unable to continue the upload");
  }
};

exports.getCourseActivity = async (req, res) => {
  try {
    const course = await findCourse(req.params.id);
    if (!course) throw new CourseEditError(404, "Course not found");
    const data = await CourseAudit.find({ course: course._id }).sort({ createdAt: -1 }).limit(100).lean();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendEditError(res, error, "Load course activity failed", "Unable to load activity");
  }
};
