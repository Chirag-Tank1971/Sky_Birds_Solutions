const Platform = require("../models/Platform");
const Course = require("../models/Course");
const User = require("../models/User");
const Contact = require("../models/Contact");
const Payment = require("../models/Payment");
const Testimonial = require("../models/Testimonial");
const crypto = require("crypto");
const bunnyStream = require("../services/bunnyStream");
const { isConfigured, uploadStream } = require("../config/cloudinary");
const { processVideo, enqueueVideo, getVideoStatus, deleteVideoFiles, cleanupTempFile, validateVideoId } = require("../services/videoService");
const { rejectOversizedThumbnail } = require("../middleware/upload");
const { CourseEditError, findCourse, editCourse, sendEditError, recordAudit } = require("../services/courseEditing");
const { hasPlayableLesson, moduleOf } = require("../services/courseContent");
const { checkVideo, goLiveProblem } = require("../services/videoReadiness");
const { syncCourseVideos } = require("../services/videoState");

const newLessonId = () => `vid-${crypto.randomUUID().slice(0, 8)}`;

// Delete the files of videos no course lesson or testimonial points to any more.
const deleteUnusedVideos = async (videoIds) => {
  for (const videoId of new Set(videoIds)) {
    if (!videoId || !validateVideoId(videoId)) continue;
    const [inCourse, inTestimonial] = await Promise.all([
      Course.exists({ "videos.videoId": videoId }),
      Testimonial.exists({ videoId }),
    ]);
    if (inCourse || inTestimonial) continue;
    deleteVideoFiles(videoId);
    if (bunnyStream.isConfigured()) {
      await bunnyStream.deleteVideo(videoId).catch((err) => console.error("Bunny video delete failed:", err.message));
    }
  }
};

const STILL_NOT_READY = {
  processing: "Video is still processing",
  not_uploaded: "The video upload isn't complete",
  failed: "This video failed. Upload it again",
  missing: "Upload a video before publishing this lesson",
};

const assertPlayableIfSold = (course, message) => {
  if (["live", "private"].includes(Course.statusOf(course)) && !hasPlayableLesson(course)) {
    throw new CourseEditError(400, message);
  }
};

// Throws unless Bunny (or local storage) confirms this lesson's video is ready right now.
const assertVideoReady = async (lesson) => {
  const check = await checkVideo(lesson);
  if (check.state === "ready") return;
  if (check.state === "unknown") throw new CourseEditError(503, "Couldn't confirm the video with the video service. Please retry.");
  const progress = check.state === "processing" && check.progress ? ` (${check.progress}%)` : "";
  throw new CourseEditError(409, `${STILL_NOT_READY[check.state] || "The video isn't ready"}${progress}.`);
};

// A whole lesson list sent by the admin form. Publishing and video state stay server-owned:
// a lesson can only stay published with the same video; new or replaced ones start locked.
const submittedLessons = (submitted, current = [], modules = []) =>
  submitted.map((video) => {
    const previous = current.find((lesson) => lesson.id === video.id);
    const videoId = video.videoId || "";
    const sameVideo = Boolean(previous) && previous.videoId === videoId;
    const provider = sameVideo ? previous.provider : video.provider === "bunny" ? "bunny" : "local";
    const moduleId = video.moduleId ?? previous?.moduleId ?? "";
    return {
      id: video.id || newLessonId(),
      title: video.title || "Lesson",
      duration: video.duration || "",
      videoId,
      provider,
      upcoming: !sameVideo || previous.upcoming || Boolean(video.upcoming),
      moduleId: modules.some((item) => item.id === moduleId) ? moduleId : "",
      processingSince: sameVideo ? previous.processingSince : videoId && provider === "bunny" ? new Date() : null,
      readyAt: sameVideo ? previous.readyAt : null,
      videoFailedAt: sameVideo ? previous.videoFailedAt : null,
      link: "",
    };
  });

const videoIdsOf = (videos) => (videos || []).map((video) => video.videoId).filter(Boolean);

exports.uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image file to upload",
      });
    }

    if (isConfigured()) {
      try {
        const result = await uploadStream(req.file.buffer, {
          folder: "skybirds/courses/thumbnails",
        });
        return res.status(200).json({
          success: true,
          message: "Thumbnail uploaded to Cloudinary",
          url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (cloudErr) {
        // Never fall back to storing the image inside the course record.
        console.error("Cloudinary upload failed:", cloudErr.message);
        return res.status(502).json({
          success: false,
          message: "Image upload failed. Please try again.",
        });
      }
    }

    // Local development without Cloudinary only.
    const base64Data = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    res.status(200).json({
      success: true,
      message: "Thumbnail processed (Cloudinary credentials not set, using Data URI/fallback)",
      url: dataUri,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload thumbnail",
    });
  }
};

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select a video file to upload" });
    }

    // Respond right away; conversion runs in the background. The admin panel
    // polls GET /api/admin/videos/:videoId/status until it is ready.
    const videoId = enqueueVideo(req.file.path);
    return res.status(202).json({
      success: true,
      message: "Video uploaded. Processing has started.",
      videoId,
      status: "processing",
      size: req.file.size,
    });
  } catch (error) {
    if (req.file?.path) cleanupTempFile(req.file.path);
    return res.status(500).json({ success: false, message: "Failed to process video" });
  }
};

// Bunny Stream: create the video and return a signed, resumable (TUS) upload for the admin browser.
exports.createBunnyUpload = async (req, res) => {
  try {
    if (!bunnyStream.isConfigured()) {
      return res.status(503).json({ success: false, message: "Bunny Stream is not configured on the server" });
    }
    const upload = await bunnyStream.createUpload(req.body?.title);
    return res.status(201).json({ success: true, provider: "bunny", ...upload });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Failed to start the upload" });
  }
};

exports.getBunnyVideoStatus = async (req, res) => {
  try {
    if (!validateVideoId(req.params.videoId)) return res.status(404).json({ success: false, message: "Video not found" });
    const status = await bunnyStream.getStatus(req.params.videoId);
    return res.status(200).json({ success: true, videoId: req.params.videoId, ...status });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode === 404 ? "Video not found" : "Unable to check video status" });
  }
};

exports.getBunnyPreview = (req, res) => {
  if (!bunnyStream.isConfigured() || !validateVideoId(req.params.videoId)) {
    return res.status(404).json({ success: false, message: "Video not found" });
  }
  res.set("Cache-Control", "private, no-store");
  return res.status(200).json({ success: true, ...bunnyStream.embedUrl(req.params.videoId) });
};

exports.getVideoProcessingStatus = (req, res) => {
  const { videoId } = req.params;
  if (!validateVideoId(videoId)) return res.status(404).json({ success: false, message: "Video not found" });
  return res.status(200).json({ success: true, videoId, ...getVideoStatus(videoId) });
};

exports.createPlatform = async (req, res) => {
  try {
    const { id, name, tagline } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        message: "id and name are required",
      });
    }

    const exists = await Platform.findOne({ id });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Platform with this id already exists",
      });
    }

    const platform = await Platform.create({ id, name, tagline });

    res.status(201).json({
      success: true,
      message: "Platform created",
      data: platform,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePlatform = async (req, res) => {
  try {
    const update = {};
    for (const field of ["name", "tagline", "isActive"]) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) update[field] = req.body[field];
    }
    const platform = await Platform.findOneAndUpdate(
      { id: req.params.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Platform updated",
      data: platform,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletePlatform = async (req, res) => {
  try {
    const platform = await Platform.findOneAndUpdate(
      { id: req.params.id },
      { isActive: false },
      { new: true }
    );

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Platform deactivated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllPlatformsAdmin = async (req, res) => {
  try {
    const platforms = await Platform.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: platforms.length,
      data: platforms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createCourse = async (req, res) => {
  try {
    if (rejectOversizedThumbnail(req)) {
      return res.status(400).json({ success: false, message: "Thumbnail must be 8 MB or smaller" });
    }

    const {
      id,
      platform,
      title,
      price,
      duration,
      lessons,
      level,
      description,
      videos,
    } = req.body;

    if (!id || !platform || !title || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "id, platform, title and price are required",
      });
    }

    const platformExists = await Platform.findOne({ id: platform, isActive: true });
    if (!platformExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive platform",
      });
    }

    const exists = await Course.findOne({ id });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Course with this id already exists",
      });
    }

    let thumbnail = req.body.thumbnail || "";
    let processedVideoId = "";

    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        thumbnail = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.video && req.files.video[0]) {
        const processed = await processVideo(req.files.video[0].path);
        processedVideoId = processed.videoId;
      }
    }

    let parsedVideos = [];
    if (videos) {
      parsedVideos = typeof videos === "string" ? JSON.parse(videos) : videos;
    }

    if (processedVideoId) {
      parsedVideos.push({
        id: newLessonId(),
        title: title,
        duration: duration || "",
        videoId: processedVideoId,
      });
    }

    parsedVideos = submittedLessons(parsedVideos);

    const course = await Course.create({
      id,
      platform,
      title,
      price: Number(price),
      duration,
      lessons: parsedVideos.length > 0 ? parsedVideos.length : (Number(lessons) || 0),
      level: level || "Beginner",
      thumbnail,
      description,
      videoUrl: "",
      videos: parsedVideos,
      status: "unlive",
      isActive: false,
    });

    res.status(201).json({
      success: true,
      message: "Course created",
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    if (rejectOversizedThumbnail(req)) {
      return res.status(400).json({ success: false, message: "Thumbnail must be 8 MB or smaller" });
    }

    const existing = await findCourse(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const allowedFields = ["id", "platform", "title", "price", "duration", "lessons", "level", "thumbnail", "description", "videos", "status"];
    const updateData = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) updateData[field] = req.body[field];
    }

    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        updateData.thumbnail = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;
      }
      if (req.files.video && req.files.video[0]) {
        const processed = await processVideo(req.files.video[0].path);
        updateData.videoUrl = "";
        // Without a lesson list in the request, add to the course's current lessons
        // instead of replacing them all.
        const currentVideos = updateData.videos
          ? (typeof updateData.videos === "string" ? JSON.parse(updateData.videos) : updateData.videos)
          : existing.videos.map((video) => video.toObject());
        currentVideos.push({
          id: newLessonId(),
          title: updateData.title || "Lesson",
          duration: updateData.duration || "",
          videoId: processed.videoId,
          link: "",
        });
        updateData.videos = currentVideos;
      }
    }

    if (updateData.videos && typeof updateData.videos === "string") {
      updateData.videos = JSON.parse(updateData.videos);
    }
    if (Array.isArray(updateData.videos)) {
      updateData.videos = submittedLessons(updateData.videos, existing.videos, existing.modules);
    }
    updateData.videoUrl = "";

    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.videos && Array.isArray(updateData.videos)) {
      updateData.lessons = updateData.videos.length;
    } else if (updateData.lessons !== undefined) {
      updateData.lessons = Number(updateData.lessons);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "status")) {
      if (!Course.COURSE_STATUSES.includes(updateData.status)) {
        return res.status(400).json({ success: false, message: "Invalid course status" });
      }
      if (updateData.status === "live" || updateData.status === "private") {
        const problem = await goLiveProblem({ modules: existing.modules, videos: updateData.videos || existing.videos });
        if (problem) return res.status(problem.statusCode).json({ success: false, message: problem.message });
      }
      updateData.isActive = updateData.status !== "unlive";
    }
    if (updateData.videos) {
      const nextStatus = updateData.status || Course.statusOf(existing);
      if (["live", "private"].includes(nextStatus) && !hasPlayableLesson({ modules: existing.modules, videos: updateData.videos })) {
        return res.status(400).json({ success: false, message: "A live course needs at least one published lesson." });
      }
      updateData.$inc = { __v: 1 };
    }

    const previousVideoIds = videoIdsOf(existing.videos);
    // A lesson list replaces the whole array, so it must not overwrite a change made since it was read.
    const target = updateData.videos ? { _id: existing._id, __v: existing.__v ?? null } : { _id: existing._id };
    const course = await Course.findOneAndUpdate(target, updateData, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(updateData.videos ? 409 : 404).json({
        success: false,
        message: updateData.videos ? "This course was changed elsewhere. Please refresh and try again." : "Course not found",
      });
    }

    // Lessons removed or given a new video: delete the old files if nothing else uses them.
    const currentVideoIds = new Set(videoIdsOf(course.videos));
    await deleteUnusedVideos(previousVideoIds.filter((videoId) => !currentVideoIds.has(videoId)));

    res.status(200).json({
      success: true,
      message: "Course updated",
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    let course = await Course.findOneAndUpdate(
      { id: req.params.id },
      { isActive: false, status: "unlive" },
      { new: true }
    );

    if (!course) {
      course = await Course.findByIdAndUpdate(
        req.params.id,
        { isActive: false, status: "unlive" },
        { new: true }
      );
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deactivated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addVideoToCourse = async (req, res) => {
  try {
    const { duration, videoId, link, provider } = req.body || {};
    const title = String(req.body?.title || "").trim().slice(0, 200);
    // Lessons start locked. Asking for a published lesson only works with a video that's ready now.
    let upcoming = req.body?.upcoming !== false;
    if (!title || (!videoId && !link && !upcoming)) {
      return res.status(400).json({ success: false, message: "title and videoId are required" });
    }
    if (!videoId && !upcoming) {
      return res.status(400).json({
        success: false,
        message: "Legacy public video links are no longer accepted. Upload/process the video first.",
      });
    }
    if (videoId && !validateVideoId(videoId)) return res.status(400).json({ success: false, message: "Invalid video" });

    const safeProvider = provider === "bunny" ? "bunny" : "local";
    if (!upcoming) {
      const { state } = await checkVideo({ videoId, provider: safeProvider });
      if (state !== "ready") upcoming = true;
    }

    const moduleId = req.body?.moduleId ? String(req.body.moduleId) : "";
    const { course } = await editCourse(req.params.id, (doc) => {
      if (moduleId && !doc.modules.some((item) => item.id === moduleId)) throw new CourseEditError(400, "Module not found");
      doc.videos.push({
        id: newLessonId(),
        title,
        duration: duration ? String(duration).trim().slice(0, 40) : "",
        videoId: videoId || "",
        provider: safeProvider,
        moduleId,
        upcoming,
        processingSince: videoId && safeProvider === "bunny" ? new Date() : null,
        link: "",
      });
      doc.videoUrl = "";
      doc.lessons = doc.videos.length;
    });

    return res.status(200).json({ success: true, message: "Video added", data: course });
  } catch (error) {
    return sendEditError(res, error, "Add lesson failed", "Unable to add the lesson");
  }
};

// Full course for the admin editor, in any status (the public endpoint hides unlive courses).
exports.getCourseAdmin = async (req, res) => {
  try {
    const course = await findCourse(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    const data = course.toObject();
    data.status = Course.statusOf(data);
    // Fallback for missed webhooks: refresh recorded video state in the background.
    syncCourseVideos(data).catch((error) => console.error("Course video sync failed:", error.message));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load the course" });
  }
};

exports.setCourseStatus = async (req, res) => {
  try {
    const status = String(req.body?.status || "");
    if (!Course.COURSE_STATUSES.includes(status)) throw new CourseEditError(400, "Invalid course status");
    const { course } = await editCourse(req.params.id, async (doc) => {
      if (status === "live" || status === "private") {
        const problem = await goLiveProblem(doc);
        if (problem) throw new CourseEditError(problem.statusCode, problem.message);
      }
      doc.status = status;
      doc.isActive = status !== "unlive";
    });
    await recordAudit(req, course, `course_${status}`, "course", { id: course.id, title: course.title });
    return res.status(200).json({ success: true, message: `Course is now ${status}`, data: course });
  } catch (error) {
    return sendEditError(res, error, "Set course status failed", "Unable to change the course status");
  }
};

// Rename, move, publish or unpublish a lesson, or replace its video; the old video is cleaned up if nothing else uses it.
exports.updateLesson = async (req, res) => {
  const { title, duration, videoId, provider, moduleId, upcoming } = req.body || {};
  const replacing = videoId !== undefined;
  try {
    if (replacing && !validateVideoId(videoId)) throw new CourseEditError(400, "Invalid video");
    const safeProvider = provider === "bunny" ? "bunny" : "local";
    let lesson;
    let replaced = null;
    let held = false;
    let moved = false;
    const { course } = await editCourse(req.params.id, async (doc) => {
      lesson = doc.videos.find((v) => v.id === req.params.videoId);
      if (!lesson) throw new CourseEditError(404, "Lesson not found");
      replaced = null;
      held = false;
      moved = false;

      if (title !== undefined) {
        const clean = String(title).trim();
        if (!clean) throw new CourseEditError(400, "Lesson title is required");
        lesson.title = clean.slice(0, 200);
      }
      if (duration !== undefined) lesson.duration = String(duration).trim().slice(0, 40);

      if (moduleId !== undefined && String(moduleId) !== lesson.moduleId) {
        const target = String(moduleId);
        if (target && !doc.modules.some((item) => item.id === target)) throw new CourseEditError(400, "Module not found");
        lesson.moduleId = target;
        moved = true;
      }

      if (replacing && videoId !== lesson.videoId) {
        replaced = lesson.videoId;
        lesson.videoId = videoId;
        lesson.provider = safeProvider;
        if (duration === undefined) lesson.duration = "";
        lesson.processingSince = safeProvider === "bunny" ? new Date() : null;
        lesson.readyAt = null;
        lesson.videoFailedAt = null;
        // Learners must not land on a video that's still processing: hold the lesson until it's published again.
        if (upcoming !== false && !lesson.upcoming) {
          const { state } = await checkVideo(lesson);
          if (state !== "ready") {
            lesson.upcoming = true;
            held = true;
          }
        }
      }

      if (upcoming === false) {
        if (!lesson.videoId) throw new CourseEditError(400, "Upload a video before publishing this lesson.");
        if (moduleOf(doc, lesson)?.upcoming) throw new CourseEditError(409, "Publish the module to make this lesson available.");
        await assertVideoReady(lesson);
        lesson.upcoming = false;
      } else if (upcoming === true) {
        lesson.upcoming = true;
      }

      assertPlayableIfSold(doc, "A live course needs at least one published lesson.");
    });

    if (replaced) await deleteUnusedVideos([replaced]);
    if (moved) await recordAudit(req, course, "lesson_moved", "lesson", lesson);
    if (upcoming === false) await recordAudit(req, course, "lesson_published", "lesson", lesson);
    if (upcoming === true || held) await recordAudit(req, course, "lesson_unpublished", "lesson", lesson);
    return res.status(200).json({
      success: true,
      message: held ? "Video replaced. Publish the lesson again when it finishes processing." : "Lesson updated",
      data: course,
    });
  } catch (error) {
    // The replacement upload was never attached, so don't leave it stored.
    if (replacing) await deleteUnusedVideos([videoId]);
    return sendEditError(res, error, "Update lesson failed", "Unable to update the lesson");
  }
};

exports.reorderLessons = async (req, res) => {
  try {
    const order = Array.isArray(req.body?.order) ? req.body.order.map(String) : null;
    const { course } = await editCourse(req.params.id, (doc) => {
      const ids = doc.videos.map((v) => v.id);
      if (!order || order.length !== ids.length || new Set(order).size !== ids.length || order.some((lessonId) => !ids.includes(lessonId))) {
        throw new CourseEditError(400, "The new order must list every lesson exactly once");
      }
      doc.videos = order.map((lessonId) => doc.videos.find((v) => v.id === lessonId));
    });
    return res.status(200).json({ success: true, message: "Lessons reordered", data: course });
  } catch (error) {
    return sendEditError(res, error, "Reorder lessons failed", "Unable to reorder lessons");
  }
};

exports.removeVideoFromCourse = async (req, res) => {
  try {
    let removed;
    const { course } = await editCourse(req.params.id, (doc) => {
      removed = doc.videos.find((v) => v.id === req.params.videoId);
      if (!removed) throw new CourseEditError(404, "Lesson not found");
      doc.videos = doc.videos.filter((v) => v.id !== req.params.videoId);
      doc.lessons = doc.videos.length;
      assertPlayableIfSold(doc, "Make the course unlive or upcoming before removing its last lesson.");
    });
    await deleteUnusedVideos(videoIdsOf([removed]));
    await recordAudit(req, course, "lesson_deleted", "lesson", removed);
    return res.status(200).json({ success: true, message: "Video removed", data: course });
  } catch (error) {
    return sendEditError(res, error, "Remove lesson failed", "Unable to remove the lesson");
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find()
      .select("-__v")
      .populate("purchasedCourses.course", "id title price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .select("-__v")
      .populate("purchasedCourses.course");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, isBlocked } = req.body;

    const customer = await User.findOneAndUpdate(
      // Past (deleted) customers are read-only.
      { _id: req.params.id, deletedAt: { $exists: false } },
      { name, isBlocked },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const existing = await User.findById(req.params.id).select("mobile email deletedAt");
    if (!existing) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    if (existing.deletedAt) {
      return res.status(409).json({ success: false, message: "This customer has already been deleted" });
    }

    // Soft delete: keep the record (and its purchase history) as a past user. Freeing mobile/email
    // lets the person sign up again; passwordChangedAt signs out every existing session.
    const now = new Date();
    const archive = { deletedAt: now, passwordChangedAt: now };
    if (existing.mobile) archive.pastMobile = existing.mobile;
    if (existing.email) archive.pastEmail = existing.email;
    await User.updateOne(
      { _id: existing._id, deletedAt: { $exists: false } },
      { $set: archive, $unset: { mobile: 1, email: 1, passwordHash: 1, passwordResetJti: 1 } }
    );

    res.status(200).json({
      success: true,
      message: "Customer moved to past users",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Customers an admin has deleted stay in the database as past users; stats count only current ones.
const ACTIVE = { deletedAt: { $exists: false } };

exports.getStats = async (req, res) => {
  try {
    const now = Date.now();
    const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    // Trend window starts at midnight (server time) 13 days ago, so it covers 14 calendar days.
    const trendStart = new Date(now - 13 * 24 * 60 * 60 * 1000);
    trendStart.setHours(0, 0, 0, 0);

    const [
      totalCustomers, totalCourses, totalPlatforms, blockedCustomers, totalQueries, newQueries, newCustomers30d,
      purchaseTotals, revenueTotals, revenue30Totals, revenueByDay, recentPayments, recentCustomers, recentQueries,
    ] = await Promise.all([
      User.countDocuments(ACTIVE),
      Course.countDocuments({ status: "live" }),
      Platform.countDocuments({ isActive: true }),
      User.countDocuments({ ...ACTIVE, isBlocked: true }),
      Contact.countDocuments(),
      Contact.countDocuments({ status: "new" }),
      User.countDocuments({ ...ACTIVE, createdAt: { $gte: since30 } }),
      User.aggregate([{ $group: { _id: null, total: { $sum: { $size: { $ifNull: ["$purchasedCourses", []] } } } } }]),
      Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$finalAmount" }, count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: "paid", paidAt: { $gte: since30 } } }, { $group: { _id: null, total: { $sum: "$finalAmount" }, count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { status: "paid", paidAt: { $gte: trendStart } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: "Asia/Kolkata" } }, total: { $sum: "$finalAmount" }, count: { $sum: 1 } } },
      ]),
      Payment.find({ status: "paid" }).sort({ paidAt: -1 }).limit(6)
        .select("courseTitle finalAmount paidAt userMobile user couponCode")
        .populate("user", "name email mobile").lean(),
      User.find(ACTIVE).sort({ createdAt: -1 }).limit(5).select("name mobile email profession createdAt").lean(),
      Contact.find({ status: "new" }).sort({ createdAt: -1 }).limit(4).select("name subject createdAt").lean(),
    ]);

    // Fill every day of the window so the chart has no gaps.
    const byDay = new Map(revenueByDay.map((d) => [d._id, d]));
    const revenueTrend = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(trendStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = day.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const hit = byDay.get(key);
      return { date: key, revenue: hit?.total || 0, orders: hit?.count || 0 };
    });

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalCourses,
        totalPlatforms,
        blockedCustomers,
        totalPurchases: purchaseTotals[0]?.total || 0,
        totalQueries,
        newQueries,
        newCustomers30d,
        totalRevenue: revenueTotals[0]?.total || 0,
        paidOrders: revenueTotals[0]?.count || 0,
        revenue30d: revenue30Totals[0]?.total || 0,
        orders30d: revenue30Totals[0]?.count || 0,
        revenueTrend,
        recentPayments: recentPayments.map((p) => ({
          id: p._id,
          courseTitle: p.courseTitle,
          amount: p.finalAmount,
          paidAt: p.paidAt,
          couponCode: p.couponCode || "",
          customer: p.user?.name || p.user?.email || (p.userMobile ? `+91 ${p.userMobile}` : "Customer"),
        })),
        recentCustomers,
        recentQueries,
      },
    });
  } catch (error) {
    console.error("Admin stats failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to load dashboard stats" });
  }
};
