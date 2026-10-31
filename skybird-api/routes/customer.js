const express = require("express");
const router = express.Router();
const { protectCustomer } = require("../middleware/auth");
const {
  getPurchasedCourses,
  getProfile,
  updateProfile,
  getTransactions,
  saveLessonProgress,
  getCourseProgress,
  getWatchHistory,
} = require("../controllers/customerController");
const { getContentForCustomer } = require("../controllers/learningContentController");
const { sendContactOtp, verifyContactOtp, changePassword } = require("../controllers/authController");

router.use(protectCustomer); // all routes below need customer token

router.get("/purchased", getPurchasedCourses);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/transactions", getTransactions);
router.get("/history", getWatchHistory);
router.get("/learning-content/:type", getContentForCustomer);
router.get("/progress/:courseId", getCourseProgress);
router.put("/progress/:courseId/:lessonId", saveLessonProgress);
router.post("/password", changePassword);
router.post("/contact/send-otp", sendContactOtp);
router.post("/contact/verify-otp", verifyContactOtp);

module.exports = router;
