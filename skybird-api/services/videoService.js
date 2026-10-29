const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const PRIVATE_ROOT = path.resolve(process.env.VIDEO_STORAGE_PATH || path.join(__dirname, "../private-videos"));
const TEMP_ROOT = path.join(PRIVATE_ROOT, "tmp");
const VIDEO_ROOT = path.join(PRIVATE_ROOT, "hls");
const MAX_WIDTH = 1280;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
ensureDir(TEMP_ROOT);
ensureDir(VIDEO_ROOT);

function videoDir(videoId) {
  return path.join(VIDEO_ROOT, videoId);
}

function keyPath(videoId) {
  return path.join(videoDir(videoId), "enc.key");
}

function validateVideoId(videoId) {
  return /^[0-9a-f-]{36}$/i.test(videoId);
}

// Size of the encoded output: width capped at MAX_WIDTH, height kept even.
function outputResolution(inputWidth, inputHeight) {
  if (!inputWidth || !inputHeight) return null;
  const width = Math.min(MAX_WIDTH, inputWidth);
  const height = Math.round((inputHeight * width) / inputWidth / 2) * 2;
  return `${width}x${height}`;
}

async function encodeVideo(inputPath, videoId) {
  const outDir = videoDir(videoId);
  ensureDir(outDir);

  const key = crypto.randomBytes(16);
  fs.writeFileSync(keyPath(videoId), key, { mode: 0o600 });

  const keyInfoPath = path.join(outDir, "keyinfo");
  // The URI is rewritten by the protected media-playlist endpoint; the local
  // key path is used only by ffmpeg while producing encrypted HLS.
  fs.writeFileSync(
    keyInfoPath,
    `enc.key\n${keyPath(videoId)}\n`,
    { mode: 0o600 }
  );

  const output = path.join(outDir, "media.m3u8");
  let resolution = null;

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions([
          "-preset", process.env.FFMPEG_PRESET || "veryfast",
          "-crf", process.env.FFMPEG_CRF || "23",
          "-profile:v", "main",
          "-level", "4.0",
          "-pix_fmt", "yuv420p",
          "-vf", `scale=w='min(${MAX_WIDTH},iw)':h='-2'`,
          "-maxrate", "2800k",
          "-bufsize", "5600k",
          "-g", "48",
          "-keyint_min", "48",
          "-sc_threshold", "0",
          "-hls_time", "6",
          "-hls_playlist_type", "vod",
          "-hls_flags", "independent_segments",
          "-hls_segment_filename", path.join(outDir, "segment_%05d.ts"),
          "-hls_key_info_file", keyInfoPath,
        ])
        .output(output)
        .on("codecData", (data) => {
          const match = /(\d{2,5})x(\d{2,5})/.exec(String(data?.video_details || ""));
          if (match) resolution = outputResolution(Number(match[1]), Number(match[2]));
        })
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    // avc1.4d4028 = H.264 Main profile, level 4.0, matching the encode settings above.
    const master = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=3200000,AVERAGE-BANDWIDTH=2800000,${resolution ? `RESOLUTION=${resolution},` : ""}CODECS="avc1.4d4028,mp4a.40.2"
media.m3u8
`;
    // master.m3u8 is written last: its presence means the video is ready.
    fs.writeFileSync(path.join(outDir, "master.m3u8"), master);

    // Remove the ffmpeg-only key info file. Keep the encryption key private.
    fs.rmSync(keyInfoPath, { force: true });
    fs.rmSync(inputPath, { force: true });

    return {
      videoId,
      storage: "hls-aes128",
      directory: outDir,
    };
  } catch (error) {
    fs.rmSync(outDir, { recursive: true, force: true });
    throw error;
  }
}

// Convert an upload and wait for it. Used where the caller needs the result
// before responding (testimonials, multipart course create/update).
async function processVideo(inputPath) {
  return encodeVideo(inputPath, crypto.randomUUID());
}

// ---- Background processing: one video at a time ----
const jobs = new Map(); // videoId -> { status: "queued" | "processing" | "failed", error, inputPath, finishedAt }
const queue = [];
let working = false;

async function runQueue() {
  if (working) return;
  working = true;
  while (queue.length) {
    const videoId = queue.shift();
    const job = jobs.get(videoId);
    if (!job) continue;
    job.status = "processing";
    try {
      await encodeVideo(job.inputPath, videoId);
      jobs.delete(videoId);
    } catch (error) {
      console.error(`Video ${videoId} failed to process:`, error.message);
      fs.rmSync(job.inputPath, { force: true });
      Object.assign(job, { status: "failed", error: "Video could not be processed", finishedAt: Date.now() });
    }
  }
  working = false;
}

// Queue an uploaded file for conversion and return its videoId immediately.
function enqueueVideo(inputPath) {
  const videoId = crypto.randomUUID();
  jobs.set(videoId, { status: "queued", inputPath });
  queue.push(videoId);
  runQueue();
  return videoId;
}

// ready | queued | processing | failed | missing
function getVideoStatus(videoId) {
  if (!validateVideoId(videoId)) return { status: "missing" };
  if (fs.existsSync(path.join(videoDir(videoId), "master.m3u8"))) return { status: "ready" };
  const job = jobs.get(videoId);
  if (job) return { status: job.status, error: job.error, position: job.status === "queued" ? queue.indexOf(videoId) + 1 : 0 };
  // A folder without master.m3u8 and no job: processing was interrupted by a restart.
  if (fs.existsSync(videoDir(videoId))) return { status: "failed", error: "Processing was interrupted. Please upload the video again." };
  return { status: "missing" };
}

// Videos queued, converting, or recently failed in this process.
function listVideoJobs() {
  return [...jobs].map(([videoId, job]) => ({ videoId, status: job.status, error: job.error, finishedAt: job.finishedAt }));
}

function deleteVideoFiles(videoId) {
  if (!validateVideoId(videoId)) return;
  fs.rmSync(videoDir(videoId), { recursive: true, force: true });
}

function startVideoWorker() {
  // Uploads left in tmp by a previous run can never be processed now.
  for (const name of fs.readdirSync(TEMP_ROOT)) fs.rmSync(path.join(TEMP_ROOT, name), { force: true, recursive: true });
  // Forget failed jobs after an hour.
  const timer = setInterval(() => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [videoId, job] of jobs) if (job.status === "failed" && job.finishedAt < cutoff) jobs.delete(videoId);
  }, 10 * 60 * 1000);
  timer.unref();
}

function cleanupTempFile(filePath) {
  if (filePath) fs.rmSync(filePath, { force: true });
}

module.exports = {
  PRIVATE_ROOT,
  TEMP_ROOT,
  VIDEO_ROOT,
  videoDir,
  keyPath,
  validateVideoId,
  outputResolution,
  processVideo,
  enqueueVideo,
  getVideoStatus,
  listVideoJobs,
  deleteVideoFiles,
  startVideoWorker,
  cleanupTempFile,
};
