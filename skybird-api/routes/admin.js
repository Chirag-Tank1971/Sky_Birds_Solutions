const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../middleware/auth");
const { createPlaybackToken, getProtectedFile } = require("../services/playbackService");
const { validateVideoId } = require("../services/videoService");
const { upload, memoryUpload } = require("../middleware/upload");
const Admin = require("../models/Admin");
const { getNotifications } = require("../services/notificationService");
const {
  uploadThumbnail,
  uploadVideo,
  getVideoProcessingStatus,
  createBunnyUpload,
  getBunnyVideoStatus,
  getBunnyPreview,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getAllPlatformsAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCoursesAdmin,
  addVideoToCourse,
  removeVideoFromCourse,
  setCourseStatus,
  getCourseAdmin,
  updateLesson,
  reorderLessons,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getStats,
} = require("../controllers/adminController");
const {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  publishModule,
  unpublishModule,
  createBulkLessons,
  getBunnyVideoStatuses,
  signBunnyUpload,
  getCourseActivity,
} = require("../controllers/moduleController");
const rateLimit = require("../middleware/rateLimit");
const { getContentAdmin, createContent, updateContent, deleteContent } = require("../controllers/learningContentController");
const { getAdminSiteContent, updateSiteContent } = require("../controllers/siteController");
const {
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonialController");
const {
  getAllContacts,
  updateContactStatus,
  deleteContact,
} = require("../controllers/contactController");

router.use(protectAdmin);

router.get("/stats", getStats);

router.get("/notifications", async (req, res) => {
  try {
    res.set("Cache-Control", "private, no-store");
    return res.status(200).json({ success: true, data: await getNotifications(req.admin) });
  } catch (error) {
    console.error("Load notifications failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load notifications" });
  }
});

router.post("/notifications/read-all", async (req, res) => {
  try {
    const readAt = new Date();
    await Admin.updateOne({ _id: req.admin._id }, { $set: { notificationsReadAt: readAt } });
    return res.status(200).json({ success: true, readAt });
  } catch (error) {
    console.error("Mark notifications read failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update notifications" });
  }
});

router.get("/site-content", getAdminSiteContent);
router.put("/site-content", updateSiteContent);

router.get("/testimonials", getAdminTestimonials);
router.post("/testimonials", upload.single("video"), createTestimonial);
router.put("/testimonials/:id", updateTestimonial);
router.delete("/testimonials/:id", deleteTestimonial);

router.post("/upload/thumbnail", memoryUpload.single("thumbnail"), uploadThumbnail);
router.post("/upload/video", upload.single("video"), uploadVideo);
router.get("/videos/:videoId/status", getVideoProcessingStatus);
// Bunny Stream lesson videos: signed direct upload, encoding status, signed preview link.
router.post("/videos/bunny/uploads", createBunnyUpload);
router.post("/videos/bunny/status", getBunnyVideoStatuses);
router.get("/videos/bunny/:videoId/status", getBunnyVideoStatus);
router.post("/videos/bunny/:videoId/upload-signature", signBunnyUpload);
router.post("/videos/bunny/:videoId/preview", getBunnyPreview);

// Short-lived, admin-only authorization for previewing a private HLS upload.
router.post("/videos/:videoId/preview-token", (req, res) => {
  const { videoId } = req.params;
  if (!validateVideoId(videoId) || !getProtectedFile(videoId, "master.m3u8")) {
    return res.status(404).json({ success: false, message: "Video not found" });
  }

  const token = createPlaybackToken({
    userId: req.admin?._id?.toString() || req.user?.id || "admin-preview",
    videoId,
    role: "admin",
  });

  res.set("Cache-Control", "private, no-store");
  return res.status(200).json({
    success: true,
    token,
    expiresIn: Number(process.env.PLAYBACK_TOKEN_TTL_SECONDS || 300),
    masterUrl: `/api/videos/${videoId}/master.m3u8`,
  });
});

router.get("/platforms", getAllPlatformsAdmin);
router.post("/platforms", createPlatform);
router.put("/platforms/:id", updatePlatform);
router.delete("/platforms/:id", deletePlatform);

router.get("/courses", getAllCoursesAdmin);
router.get("/courses/:id", getCourseAdmin);
router.post(
  "/courses",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createCourse
);
router.put(
  "/courses/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateCourse
);
router.delete("/courses/:id", deleteCourse);
router.post("/courses/:id/videos", addVideoToCourse);
router.patch("/courses/:id/status", setCourseStatus);
router.get("/courses/:id/activity", getCourseActivity);
router.post("/courses/:id/modules", createModule);
// Registered before "/courses/:id/modules/:moduleId" so "order" isn't read as a module id.
router.put("/courses/:id/modules/order", reorderModules);
router.put("/courses/:id/modules/:moduleId", updateModule);
router.delete("/courses/:id/modules/:moduleId", deleteModule);
router.post("/courses/:id/modules/:moduleId/publish", publishModule);
router.post("/courses/:id/modules/:moduleId/unpublish", unpublishModule);
router.post(
  "/courses/:id/modules/:moduleId/lessons/bulk",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: "Too many bulk uploads. Please try again later." }),
  createBulkLessons
);
// Registered before "/courses/:id/videos/:videoId" so "order" isn't read as a lesson id.
router.put("/courses/:id/videos/order", reorderLessons);
router.put("/courses/:id/videos/:videoId", updateLesson);
router.delete("/courses/:id/videos/:videoId", removeVideoFromCourse);

router.get("/learning-content", getContentAdmin);
router.post("/learning-content", createContent);
router.put("/learning-content/:id", updateContent);
router.delete("/learning-content/:id", deleteContent);

router.get("/customers", getAllCustomers);
router.get("/customers/:id", getCustomerById);
router.put("/customers/:id", updateCustomer);
router.delete("/customers/:id", deleteCustomer);

router.get("/contacts", getAllContacts);
router.put("/contacts/:id/status", updateContactStatus);
router.delete("/contacts/:id", deleteContact);

module.exports = router;
