const User = require("../models/User");
const { parseProfile } = require("../services/profile");
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
      course.videos = (course.videos || []).map((video) => ({ id: video.id, title: video.title, duration: video.duration || "", videoId: video.videoId || "" }));
      return { ...course, purchasedAt: item.purchasedAt };
    });
    return res.status(200).json({ success: true, count: purchased.length, data: purchased });
  } catch (error) {
    console.error("Get purchased courses failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load purchased courses" });
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
