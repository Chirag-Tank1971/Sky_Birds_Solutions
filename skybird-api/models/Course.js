const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  duration: { type: String, default: "" },
  // Legacy field retained for backward compatibility but is never exposed by
  // public course APIs and is never used as a public streaming URL.
  link: { type: String, default: "" },
  videoId: { type: String, default: "" },
  // Where videoId lives: "local" = HLS on the API server (legacy), "bunny" = Bunny Stream.
  provider: { type: String, enum: ["local", "bunny"], default: "local" },
  // Shown to learners as "Upcoming" (locked); may have no video yet and can't be played.
  upcoming: { type: Boolean, default: false },
  // Module this lesson belongs to; empty = the default "Course content" group.
  moduleId: { type: String, default: "" },
  // Video state recorded from Bunny for the admin. Never changes what learners can see.
  processingSince: { type: Date, default: null },
  readyAt: { type: Date, default: null },
  videoFailedAt: { type: Date, default: null },
}, { _id: false });

const moduleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, default: "", maxlength: 1000 },
  // Locks every lesson inside. Modules start locked and are published by an admin.
  upcoming: { type: Boolean, default: true },
}, { _id: false });

const courseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    platform: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, default: "" },
    lessons: { type: Number, default: 0 },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    thumbnail: { type: String, default: "" },
    description: { type: String, default: "" },
    // Legacy field retained only so old documents remain readable by admins.
    videoUrl: { type: String, default: "" },
    videos: [videoSchema],
    modules: [moduleSchema],
    // live: listed + purchasable · upcoming: listed as "coming soon", not purchasable ·
    // private: direct link only, purchasable · unlive: hidden. Buyers keep access in every status.
    status: { type: String, enum: ["live", "upcoming", "private", "unlive"], default: "live" },
    // Legacy flag kept in sync with status (true unless unlive) for older clients.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, optimisticConcurrency: true }
);

// Which statuses allow what. Documents created before `status` existed have none: fall back to isActive.
const COURSE_STATUSES = ["live", "upcoming", "private", "unlive"];
const LISTED = ["live", "upcoming"];
const VIEWABLE = ["live", "upcoming", "private"];
const PURCHASABLE = ["live", "private"];
const statusOf = (course) => course?.status || (course?.isActive === false ? "unlive" : "live");
const statusFilter = (statuses) => ({
  $or: [{ status: { $in: statuses } }, { status: { $exists: false }, isActive: statuses.includes("live") }],
});

module.exports = mongoose.model("Course", courseSchema);
module.exports.COURSE_STATUSES = COURSE_STATUSES;
module.exports.statusOf = statusOf;
module.exports.listedFilter = () => statusFilter(LISTED);
module.exports.viewableFilter = () => statusFilter(VIEWABLE);
module.exports.isViewable = (course) => VIEWABLE.includes(statusOf(course));
module.exports.isPurchasable = (course) => PURCHASABLE.includes(statusOf(course));
