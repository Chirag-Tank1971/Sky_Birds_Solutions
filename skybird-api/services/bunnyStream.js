// Bunny Stream video hosting for course lessons (https://docs.bunny.net/reference/video_createvideo).
// Videos are uploaded from the admin browser straight to Bunny (TUS), encoded by Bunny, and played
// through Bunny's embed player with short-lived signed links issued only to buyers.
const crypto = require("crypto");

const API_BASE = "https://video.bunnycdn.com";
const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";
const EMBED_BASE = "https://iframe.mediadelivery.net/embed";
const UPLOAD_LINK_SECONDS = 6 * 60 * 60;
const EMBED_LINK_SECONDS = 6 * 60 * 60;

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function coursesLibrary() {
  const libraryId = String(process.env.BUNNY_COURSES_LIBRARY_ID || "").trim();
  const apiKey = String(process.env.BUNNY_COURSES_API_KEY || "").trim();
  const tokenKey = String(process.env.BUNNY_COURSES_TOKEN_KEY || "").trim();
  return libraryId && apiKey ? { libraryId, apiKey, tokenKey } : null;
}

const isConfigured = () => Boolean(coursesLibrary());

async function bunnyRequest(path, { method = "GET", body } = {}) {
  const lib = coursesLibrary();
  if (!lib) throw Object.assign(new Error("Bunny Stream is not configured"), { statusCode: 503 });
  let response;
  try {
    response = await fetch(`${API_BASE}/library/${lib.libraryId}${path}`, {
      method,
      headers: { AccessKey: lib.apiKey, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw Object.assign(new Error("Video service is unreachable. Please try again."), { statusCode: 503 });
  }
  const text = await response.text();
  if (!response.ok) {
    console.error(`Bunny ${method} ${path} failed (HTTP ${response.status}): ${text.slice(0, 300)}`);
    throw Object.assign(new Error("Video service rejected the request"), { statusCode: response.status === 404 ? 404 : 502 });
  }
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

// Creates the video entry and returns what the admin browser needs for a resumable TUS upload.
async function createUpload(title) {
  const video = await bunnyRequest("/videos", { method: "POST", body: { title: String(title || "Lesson").slice(0, 200) } });
  if (!video.guid) throw Object.assign(new Error("Video service did not return a video id"), { statusCode: 502 });
  return { videoId: video.guid, ...signUpload(video.guid) };
}

// Bunny's TUS signature: sha256(library_id + api_key + expiration_time + video_id).
function signUpload(videoId) {
  const lib = coursesLibrary();
  const expire = Math.floor(Date.now() / 1000) + UPLOAD_LINK_SECONDS;
  return {
    libraryId: lib.libraryId,
    endpoint: TUS_ENDPOINT,
    expire,
    signature: sha256(`${lib.libraryId}${lib.apiKey}${expire}${videoId}`),
  };
}

// Bunny status codes: 0 created, 1 uploaded, 2 processing, 3 transcoding, 4 finished, 5 error, 6 upload failed.
async function getStatus(videoId) {
  const video = await bunnyRequest(`/videos/${encodeURIComponent(videoId)}`);
  const status = video.status === 4 ? "ready" : video.status === 5 || video.status === 6 ? "failed" : "processing";
  // rawStatus >= 1 means Bunny has received the uploaded file.
  return { status, rawStatus: Number(video.status) || 0, progress: Number(video.encodeProgress) || 0, durationSeconds: Number(video.length) || 0 };
}

async function deleteVideo(videoId) {
  try {
    await bunnyRequest(`/videos/${encodeURIComponent(videoId)}`, { method: "DELETE" });
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
}

// Signed embed link: sha256(token_key + video_id + expires). Without a token key (token auth off) it is unsigned.
function embedUrl(videoId) {
  const lib = coursesLibrary();
  const url = new URL(`${EMBED_BASE}/${lib.libraryId}/${encodeURIComponent(videoId)}`);
  if (lib.tokenKey) {
    const expires = Math.floor(Date.now() / 1000) + EMBED_LINK_SECONDS;
    url.searchParams.set("token", sha256(`${lib.tokenKey}${videoId}${expires}`));
    url.searchParams.set("expires", String(expires));
  }
  url.searchParams.set("autoplay", "false");
  url.searchParams.set("preload", "true");
  url.searchParams.set("responsive", "true");
  return { embedUrl: url.toString(), expiresIn: EMBED_LINK_SECONDS };
}

module.exports = { isConfigured, createUpload, signUpload, getStatus, deleteVideo, embedUrl };
