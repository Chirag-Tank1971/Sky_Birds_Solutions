const Platform = require("../models/Platform");
const Course = require("../models/Course");
const User = require("../models/User");
const Contact = require("../models/Contact");
const Payment = require("../models/Payment");
const Testimonial = require("../models/Testimonial");
const crypto = require("crypto");
const { isConfigured, uploadStream } = require("../config/cloudinary");
const { processVideo, enqueueVideo, getVideoStatus, deleteVideoFiles, cleanupTempFile, validateVideoId } = require("../services/videoService");
const { rejectOversizedThumbnail } = require("../middleware/upload");

const newLessonId = () => `vid-${crypto.randomUUID().slice(0, 8)}`;

const findCourse = async (idOrObjectId) => {
  const id = String(idOrObjectId || "");
  return (await Course.findOne({ id })) || (/^[a-f\d]{24}$/i.test(id) ? await Course.findById(id) : null);
};

// Delete the files of videos no course lesson or testimonial points to any more.
const deleteUnusedVideos = async (videoIds) => {
  for (const videoId of new Set(videoIds)) {
    if (!videoId || !validateVideoId(videoId)) continue;
    const [inCourse, inTestimonial] = await Promise.all([
      Course.exists({ "videos.videoId": videoId }),
      Testimonial.exists({ videoId }),
    ]);
    if (!inCourse && !inTestimonial) deleteVideoFiles(videoId);
  }
};

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

    parsedVideos = parsedVideos.map((video) => ({
      id: video.id || newLessonId(),
      title: video.title,
      duration: video.duration || "",
      videoId: video.videoId || "",
      link: "",
    }));

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

    const allowedFields = ["id", "platform", "title", "price", "duration", "lessons", "level", "thumbnail", "description", "videos", "isActive"];
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
      updateData.videos = updateData.videos.map((video) => ({
        id: video.id || newLessonId(),
        title: video.title || "Lesson",
        duration: video.duration || "",
        videoId: video.videoId || "",
        link: "",
      }));
    }
    updateData.videoUrl = "";

    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.videos && Array.isArray(updateData.videos)) {
      updateData.lessons = updateData.videos.length;
    } else if (updateData.lessons !== undefined) {
      updateData.lessons = Number(updateData.lessons);
    }

    const previousVideoIds = videoIdsOf(existing.videos);
    const course = await Course.findByIdAndUpdate(existing._id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
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
      { isActive: false },
      { new: true }
    );

    if (!course) {
      course = await Course.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
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
    const { title, duration, videoId, link } = req.body;
    if (!title || (!videoId && !link)) {
      return res.status(400).json({ success: false, message: "title and videoId are required" });
    }

    let course = await Course.findOne({ id: req.params.id });
    if (!course) course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Legacy public video links are no longer accepted. Upload/process the video first.",
      });
    }

    course.videos.push({
      id: newLessonId(),
      title,
      duration: duration || "",
      videoId,
      link: "",
    });
    course.videoUrl = "";
    course.lessons = course.videos.length;
    await course.save();

    res.status(200).json({ success: true, message: "Video added", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeVideoFromCourse = async (req, res) => {
  try {
    let course = await Course.findOne({ id: req.params.id });
    if (!course) {
      course = await Course.findById(req.params.id);
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const removedVideoIds = videoIdsOf(course.videos.filter((v) => v.id === req.params.videoId));
    course.videos = course.videos.filter((v) => v.id !== req.params.videoId);
    course.lessons = course.videos.length;
    await course.save();
    await deleteUnusedVideos(removedVideoIds);

    res.status(200).json({
      success: true,
      message: "Video removed",
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
      Course.countDocuments({ isActive: true }),
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
