const mongoose = require("mongoose");

// One browser that is allowed to stream a customer's courses. The newest devices win: when a
// customer starts on more devices than allowed, the least recently used ones are ended.
const playbackSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // sha256 of the browser's session ID; the ID itself is never stored.
    sessionHash: { type: String, required: true },
    // Short code shown in the video watermark, to trace a leaked recording to this device.
    code: { type: String, required: true },
    userAgent: { type: String, default: "", maxlength: 160 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    lastSeenAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    endedReason: { type: String, enum: ["", "replaced", "logout", "admin"], default: "" },
    // Removed automatically after this, whether active or ended.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

playbackSessionSchema.index({ user: 1, sessionHash: 1 }, { unique: true });
playbackSessionSchema.index({ user: 1, endedAt: 1, lastSeenAt: -1 });
playbackSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PlaybackSession", playbackSessionSchema);
