const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    quote: { type: String, default: "" },
    // A processed upload (videoId), or a video stored with the user site (videoUrl, a path on that site).
    videoId: { type: String, required() { return !this.videoUrl; } },
    videoUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);
