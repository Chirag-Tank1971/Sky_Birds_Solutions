const mongoose = require("mongoose");

// The site's content as it was before a publish, so any publish can be undone.
const siteContentVersionSchema = new mongoose.Schema(
  {
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    replacedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

siteContentVersionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SiteContentVersion", siteContentVersionSchema);
