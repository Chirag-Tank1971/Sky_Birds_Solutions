const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createPlaybackAuthorization,
} = require("../controllers/courseController");

router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.post("/:id/videos/:videoId/playback", createPlaybackAuthorization);

module.exports = router;
