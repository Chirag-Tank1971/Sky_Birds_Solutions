// Limits how many devices can stream one customer's courses at a time. The newest devices win, so a
// paying student is never locked out: starting on a new device ends the least recently used one.
const crypto = require("crypto");
const PlaybackSession = require("../models/PlaybackSession");
const PlaybackEvent = require("../models/PlaybackEvent");

const SESSION_ID = /^[A-Za-z0-9_-]{43}$/;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const KEEP_DAYS = 30;

// 0 turns the limit off (sessions are still recorded, for watermark codes and tracing).
const maxDevices = () => {
  const value = Number(process.env.MAX_COURSE_SESSIONS ?? 2);
  return Number.isInteger(value) && value >= 0 ? value : 2;
};

const hash = (id) => crypto.createHash("sha256").update(id).digest("hex");
const validId = (value) => (typeof value === "string" && SESSION_ID.test(value) ? value : null);
const newCode = () => Array.from(crypto.randomBytes(6), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
const keepUntil = (now) => new Date(now.getTime() + KEEP_DAYS * 24 * 60 * 60 * 1000);

// Starts (or resumes) playback on this device. Returns the session ID to keep and its watermark code.
async function claim(userId, rawId, { userAgent = "", courseId = null } = {}) {
  const id = validId(rawId) || crypto.randomBytes(32).toString("base64url");
  const sessionHash = hash(id);
  const now = new Date();
  const session = await PlaybackSession.findOneAndUpdate(
    { user: userId, sessionHash },
    {
      // Pressing play on a device that was replaced takes it back.
      $set: { userAgent: String(userAgent).slice(0, 160), course: courseId, lastSeenAt: now, endedAt: null, endedReason: "", expiresAt: keepUntil(now) },
      $setOnInsert: { code: newCode() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const limit = maxDevices();
  if (limit > 0) {
    const older = await PlaybackSession.find({ user: userId, endedAt: null, _id: { $ne: session._id } })
      .sort({ lastSeenAt: -1 })
      .skip(limit - 1)
      .select("_id")
      .lean();
    if (older.length) {
      await PlaybackSession.updateMany({ _id: { $in: older.map((item) => item._id) } }, { $set: { endedAt: now, endedReason: "replaced" } });
    }
  }
  return { id, code: session.code };
}

// Progress saves double as the heartbeat. "ended": this device was replaced or stopped, so its player stops.
// "unknown": no session matches (an older version of the site, or a removed record); nothing is enforced.
async function touch(userId, rawId) {
  const id = validId(rawId);
  if (!id) return "unknown";
  const now = new Date();
  const session = await PlaybackSession.findOneAndUpdate(
    { user: userId, sessionHash: hash(id) },
    [{ $set: { lastSeenAt: { $cond: [{ $eq: ["$endedAt", null] }, now, "$lastSeenAt"] } } }],
    { new: true }
  ).select("endedAt").lean();
  if (!session) return "unknown";
  return session.endedAt ? "ended" : "ok";
}

async function end(userId, rawId) {
  const id = validId(rawId);
  if (!id) return;
  await PlaybackSession.updateOne({ user: userId, sessionHash: hash(id), endedAt: null }, { $set: { endedAt: new Date(), endedReason: "logout" } });
}

async function revokeAll(userId) {
  const result = await PlaybackSession.updateMany({ user: userId, endedAt: null }, { $set: { endedAt: new Date(), endedReason: "admin" } });
  return result.modifiedCount;
}

function listActive(userId) {
  return PlaybackSession.find({ user: userId, endedAt: null })
    .sort({ lastSeenAt: -1 })
    .populate("course", "title")
    .select("code userAgent course lastSeenAt createdAt")
    .lean();
}

// Never fails the playback it records.
async function recordPlayback({ userId, courseId, lessonId, code, userAgent }) {
  try {
    await PlaybackEvent.create({ user: userId, course: courseId, lessonId, code, userAgent: String(userAgent || "").slice(0, 160) });
  } catch (error) {
    console.error("Playback record failed:", error.message);
  }
}

module.exports = { claim, touch, end, revokeAll, listActive, recordPlayback, maxDevices };
