const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "main" },
    home: { type: mongoose.Schema.Types.Mixed, default: {} },
    about: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: { type: mongoose.Schema.Types.Mixed, default: {} },
    support: { type: mongoose.Schema.Types.Mixed, default: {} },
    legal: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Unpublished edits from the website editor. Never sent to visitors.
    draft: { type: mongoose.Schema.Types.Mixed, default: null },
    draftRevision: { type: Number, default: 0 },
    draftUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
