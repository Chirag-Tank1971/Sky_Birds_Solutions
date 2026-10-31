// Server-side answer to "can learners play this lesson's video?". Publishing relies on this, never on the browser.
const bunnyStream = require("./bunnyStream");
const { getVideoStatus } = require("./videoService");
const { isLessonLocked } = require("./courseContent");

const PUBLISH_CHECK_CONCURRENCY = 5;

// state: ready | processing | not_uploaded | failed | missing | unknown (couldn't ask; treated as not ready)
async function checkVideo(lesson) {
  if (!lesson?.videoId) return { state: "missing", progress: 0 };
  if (lesson.provider !== "bunny") {
    const { status } = getVideoStatus(lesson.videoId);
    if (status === "ready") return { state: "ready", progress: 100 };
    if (status === "queued" || status === "processing") return { state: "processing", progress: 0 };
    return { state: status === "failed" ? "failed" : "missing", progress: 0 };
  }
  try {
    const video = await bunnyStream.getStatus(lesson.videoId);
    if (video.status === "ready") return { state: "ready", progress: 100, durationSeconds: video.durationSeconds };
    if (video.status === "failed") return { state: "failed", progress: video.progress };
    return { state: video.rawStatus === 0 ? "not_uploaded" : "processing", progress: video.progress };
  } catch (error) {
    if (error.statusCode === 404) return { state: "missing", progress: 0 };
    return { state: "unknown", progress: 0 };
  }
}

// Runs `worker` over items, at most `limit` at a time, keeping the input order in the result.
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const checkVideos = (lessons) => mapLimit(lessons, PUBLISH_CHECK_CONCURRENCY, checkVideo);

// Live and private courses can be bought: null if at least one unlocked lesson has a ready video, else why not.
async function goLiveProblem(course) {
  const unlocked = (course.videos || []).filter((lesson) => lesson.videoId && !isLessonLocked(course, lesson));
  if (unlocked.length === 0) {
    return { statusCode: 400, message: "Add at least one published lesson with a video before making the course live or private." };
  }
  let unknown = false;
  for (const lesson of unlocked) {
    const { state } = await checkVideo(lesson);
    if (state === "ready") return null;
    if (state === "unknown") unknown = true;
  }
  if (unknown) return { statusCode: 503, message: "Couldn't confirm the lesson videos with the video service. Please retry." };
  return { statusCode: 409, message: "None of the published lessons has a ready video yet." };
}

module.exports = { checkVideo, checkVideos, mapLimit, goLiveProblem };
