const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const privateTempDir = path.join(
  path.resolve(
    process.env.VIDEO_STORAGE_PATH || path.join(__dirname, "../private-videos"),
  ),
  "tmp",
);
const thumbnailDir = path.join(__dirname, "../uploads/thumbnails");

fs.mkdirSync(privateTempDir, { recursive: true });
fs.mkdirSync(thumbnailDir, { recursive: true });

const MAX_THUMBNAIL_BYTES = 8 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, file.fieldname === "thumbnail" ? thumbnailDir : privateTempDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  },
});

const memoryStorage = multer.memoryStorage();

const allowedMimeByExt = {
  ".jpeg": ["image/jpeg"], ".jpg": ["image/jpeg"], ".png": ["image/png"], ".gif": ["image/gif"], ".webp": ["image/webp"],
  ".mp4": ["video/mp4"], ".webm": ["video/webm"], ".mov": ["video/quicktime"], ".avi": ["video/x-msvideo", "video/avi"], ".mkv": ["video/x-matroska"],
};
// Rejected files return 400 with this message instead of a generic server error.
const badFile = (message) => Object.assign(new Error(message), { statusCode: 400 });

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowed = allowedMimeByExt[ext];
  const mime = String(file.mimetype || "").toLowerCase();
  if (!allowed || !allowed.includes(mime)) return cb(badFile("Unsupported file type"));
  // Each field only accepts its own kind of file.
  if (file.fieldname === "thumbnail" && !mime.startsWith("image/")) return cb(badFile("Thumbnail must be an image"));
  if (file.fieldname === "video" && !mime.startsWith("video/")) return cb(badFile("Video must be a video file"));
  return cb(null, true);
};
const upload = multer({ storage, limits: { fileSize: Math.min(Number(process.env.MAX_VIDEO_UPLOAD_BYTES) || 1024 * 1024 * 1024, 2 * 1024 * 1024 * 1024), files: 2, fields: 40, parts: 50 }, fileFilter });
const memoryUpload = multer({ storage: memoryStorage, limits: { fileSize: MAX_THUMBNAIL_BYTES, files: 1, fields: 20, parts: 25 }, fileFilter: (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase(); const allowed = allowedMimeByExt[ext];
  if (allowed && allowed[0].startsWith("image/") && allowed.includes(String(file.mimetype || "").toLowerCase())) return cb(null, true);
  return cb(badFile("Only supported image files are allowed for this upload"));
} });

// Multer's disk storage has one size limit for every field, so thumbnails that
// arrive with a course upload are size-checked here. Removes all uploaded files
// and returns true when the thumbnail is too large.
function rejectOversizedThumbnail(req) {
  const thumb = req.files?.thumbnail?.[0];
  if (!thumb || thumb.size <= MAX_THUMBNAIL_BYTES) return false;
  for (const list of Object.values(req.files)) for (const file of list) fs.rmSync(file.path, { force: true });
  return true;
}

module.exports = { upload, memoryUpload, rejectOversizedThumbnail, MAX_THUMBNAIL_BYTES };
