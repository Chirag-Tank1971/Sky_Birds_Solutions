const User = require("../models/User");
const Payment = require("../models/Payment");
const { parseProfile } = require("../services/profile");
const { publicVideos, publicModules, isLessonLocked, moduleOf } = require("../services/courseContent");
const { findCourse } = require("../services/courseEditing");
const Course = require("../models/Course");
const LessonProgress = require("../models/LessonProgress");
// Registers the Course model used by populate() below.
require("../models/Course");

// @desc    Get courses purchased by logged-in customer
// @route   GET /api/customer/purchased
exports.getPurchasedCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: "purchasedCourses.course", model: "Course" });
    if (!user) return res.status(404).json({ success: false, message: "Customer not found" });
    const purchased = user.purchasedCourses.filter((item) => item.course).map((item) => {
      const course = item.course.toObject();
      course.videoUrl = "";
      const videos = publicVideos(course);
      course.modules = publicModules(course);
      course.videos = videos;
      return { ...course, purchasedAt: item.purchasedAt };
    });
    return res.status(200).json({ success: true, count: purchased.length, data: purchased });
  } catch (error) {
    console.error("Get purchased courses failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load purchased courses" });
  }
};

const MAX_VIDEO_SECONDS = 24 * 60 * 60;
const COMPLETED_AT = 0.95;
const ownsCourse = (user, course) =>
  user.purchasedCourses.some((item) => item.course && String(item.course) === String(course._id));

// @desc    Save where the customer got to in a lesson
// @route   PUT /api/customer/progress/:courseId/:lessonId
exports.saveLessonProgress = async (req, res) => {
  try {
    const position = req.body?.position;
    const duration = req.body?.duration ?? 0;
    const valid = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_VIDEO_SECONDS;
    if (!valid(position) || !valid(duration)) return res.status(400).json({ success: false, message: "Invalid position" });

    const course = await findCourse(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!ownsCourse(req.user, course)) return res.status(403).json({ success: false, message: "Please purchase this course" });
    const lesson = course.videos.find((item) => item.id === req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
    if (isLessonLocked(course, lesson)) return res.status(403).json({ success: false, message: "This lesson is coming soon." });

    const set = { position: duration ? Math.min(position, duration) : position, duration, lastWatchedAt: new Date() };
    if (req.body?.completed === true || (duration > 0 && position / duration >= COMPLETED_AT)) set.completed = true;
    await LessonProgress.updateOne(
      { user: req.user._id, course: course._id, lessonId: lesson.id },
      { $set: set },
      { upsert: true }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    // Two saves creating the same record at once: the other one already stored it.
    if (error.code === 11000) return res.status(200).json({ success: true });
    console.error("Save lesson progress failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to save progress" });
  }
};

// @desc    The customer's progress in every lesson of a course
// @route   GET /api/customer/progress/:courseId
exports.getCourseProgress = async (req, res) => {
  try {
    const course = await findCourse(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    const data = await LessonProgress.find({ user: req.user._id, course: course._id })
      .select("lessonId position duration completed lastWatchedAt -_id")
      .lean();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get course progress failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load progress" });
  }
};

// @desc    Lessons the customer watched, most recent first
// @route   GET /api/customer/history
exports.getWatchHistory = async (req, res) => {
  try {
    const records = await LessonProgress.find({ user: req.user._id }).sort({ lastWatchedAt: -1 }).limit(100).lean();
    const courses = await Course.find({ _id: { $in: [...new Set(records.map((item) => String(item.course)))] } })
      .select("id title thumbnail modules videos")
      .lean();
    const byId = new Map(courses.map((course) => [String(course._id), course]));
    const data = records.flatMap((record) => {
      const course = byId.get(String(record.course));
      const lesson = course?.videos.find((item) => item.id === record.lessonId);
      if (!lesson || !ownsCourse(req.user, course)) return [];
      return [{
        courseId: course.id,
        courseTitle: course.title,
        thumbnail: course.thumbnail || "",
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleTitle: moduleOf(course, lesson)?.title || "",
        position: record.position,
        duration: record.duration,
        completed: record.completed,
        locked: isLessonLocked(course, lesson),
        lastWatchedAt: record.lastWatchedAt,
      }];
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get watch history failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load history" });
  }
};

// @desc    Get the logged-in customer's completed payments, newest first
// @route   GET /api/customer/transactions
exports.getTransactions = async (req, res) => {
  try {
    const data = await Payment.find({ user: req.user._id, status: "paid" })
      .select("orderId paymentId provider courseTitle amount currency couponCode discountAmount paidAt")
      .sort({ paidAt: -1 })
      .lean();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get transactions failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load transactions" });
  }
};

// @desc    Get customer profile
// @route   GET /api/customer/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-__v");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Customer request failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to complete request" });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customer/profile
exports.updateProfile = async (req, res) => {
  try {
    // Email and mobile are changed only through OTP verification, never here.
    const profile = parseProfile(req.body);
    if (!profile) {
      return res.status(400).json({ success: false, message: "Please enter your name, an age between 13 and 100, and a profession." });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: profile }, { new: true, runValidators: true }).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: user,
    });
  } catch (error) {
    console.error("Customer request failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to complete request" });
  }
};
