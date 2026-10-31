const crypto = require("crypto");
const { syncVideo } = require("../services/videoState");

const STATUS_FINISHED = 3;
const STATUS_FAILED = 5;

// https://docs.bunny.net/docs/stream-webhook: HMAC-SHA256 of the raw body, keyed with the library's Read-Only API key.
function validSignature(req, key) {
  if (req.get("X-BunnyStream-Signature-Version") !== "v1") return false;
  if (req.get("X-BunnyStream-Signature-Algorithm") !== "hmac-sha256") return false;
  const supplied = Buffer.from(String(req.get("X-BunnyStream-Signature") || ""), "utf8");
  const expected = Buffer.from(crypto.createHmac("sha256", key).update(req.body).digest("hex"), "utf8");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

// Only records what happened; publishing stays a manual admin action.
exports.bunnyWebhook = async (req, res) => {
  const key = String(process.env.BUNNY_COURSES_READONLY_KEY || "").trim();
  if (!key) return res.status(404).json({ success: false, message: "Not found" });
  if (!Buffer.isBuffer(req.body) || !validSignature(req, key)) {
    console.error("Bunny webhook rejected: invalid signature");
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ success: false, message: "Invalid body" });
  }

  const isOurLibrary = String(event.VideoLibraryId) === String(process.env.BUNNY_COURSES_LIBRARY_ID || "").trim();
  if (!isOurLibrary || (event.Status !== STATUS_FINISHED && event.Status !== STATUS_FAILED) || typeof event.VideoGuid !== "string") {
    return res.status(200).json({ success: true });
  }

  try {
    // Act on what Bunny's API says now, not on the event itself.
    const { state } = await syncVideo(event.VideoGuid);
    // Bunny retries on an error response, so a failed re-fetch isn't lost.
    if (state === "unknown") return res.status(503).json({ success: false, message: "Try again later" });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Bunny webhook processing failed:", error.message);
    return res.status(503).json({ success: false, message: "Try again later" });
  }
};
