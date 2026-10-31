// Records what Bunny reports about lesson videos. It only stores state for the admin to see:
// it never publishes anything. Writes touch just the matching lessons and bump __v, so an admin
// save that started earlier retries on fresh data instead of overwriting them.
const Course = require("../models/Course");
const bunnyStream = require("./bunnyStream");
const { checkVideo, mapLimit } = require("./videoReadiness");

const SWEEP_LIMIT = 50;
const SWEEP_CONCURRENCY = 3;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

const formatDuration = (seconds) => {
  const total = Math.round(Number(seconds) || 0);
  if (total <= 0) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  return `${rest}s`;
};

async function recordReady(videoId, durationSeconds) {
  const now = new Date();
  await Course.updateMany(
    { videos: { $elemMatch: { videoId, readyAt: null } } },
    {
      $set: { "videos.$[lesson].readyAt": now, "videos.$[lesson].videoFailedAt": null, "videos.$[lesson].processingSince": null },
      $inc: { __v: 1 },
    },
    { arrayFilters: [{ "lesson.videoId": videoId, "lesson.readyAt": null }] }
  );
  const duration = formatDuration(durationSeconds);
  if (duration) {
    await Course.updateMany(
      { videos: { $elemMatch: { videoId, duration: "" } } },
      { $set: { "videos.$[lesson].duration": duration }, $inc: { __v: 1 } },
      { arrayFilters: [{ "lesson.videoId": videoId, "lesson.duration": "" }] }
    );
  }
}

async function recordFailed(videoId) {
  await Course.updateMany(
    { videos: { $elemMatch: { videoId, readyAt: null, videoFailedAt: null } } },
    { $set: { "videos.$[lesson].videoFailedAt": new Date() }, $inc: { __v: 1 } },
    { arrayFilters: [{ "lesson.videoId": videoId, "lesson.readyAt": null, "lesson.videoFailedAt": null }] }
  );
}

// Asks Bunny about one video and stores the result. Safe to repeat.
async function syncVideo(videoId) {
  const check = await checkVideo({ videoId, provider: "bunny" });
  if (check.state === "ready") await recordReady(videoId, check.durationSeconds);
  else if (check.state === "failed" || check.state === "missing") await recordFailed(videoId);
  return check;
}

const isPending = (lesson) => lesson.provider === "bunny" && lesson.videoId && !lesson.readyAt && !lesson.videoFailedAt;

async function syncCourseVideos(course) {
  if (!bunnyStream.isConfigured()) return;
  const ids = [...new Set((course.videos || []).filter(isPending).map((lesson) => lesson.videoId))].slice(0, SWEEP_LIMIT);
  await mapLimit(ids, SWEEP_CONCURRENCY, syncVideo);
}

// Catches webhooks that were missed, for example while the server was asleep.
async function sweepVideoStates() {
  if (!bunnyStream.isConfigured()) return;
  const courses = await Course.find({
    videos: { $elemMatch: { provider: "bunny", videoId: { $gt: "" }, readyAt: null, videoFailedAt: null } },
  }).select("videos").lean();
  const ids = [...new Set(courses.flatMap((course) => course.videos.filter(isPending).map((lesson) => lesson.videoId)))].slice(0, SWEEP_LIMIT);
  await mapLimit(ids, SWEEP_CONCURRENCY, syncVideo);
}

function startVideoStateSweeper() {
  const timer = setInterval(() => {
    sweepVideoStates().catch((error) => console.error("Video state sweep failed:", error.message));
  }, SWEEP_INTERVAL_MS);
  timer.unref();
}

module.exports = { formatDuration, syncVideo, syncCourseVideos, sweepVideoStates, startVideoStateSweeper };
