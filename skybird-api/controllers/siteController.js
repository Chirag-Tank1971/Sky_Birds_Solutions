const SiteContent = require("../models/SiteContent");
const SiteContentVersion = require("../models/SiteContentVersion");
const DEFAULTS = require("../config/siteDefaults");

const SECTIONS = ["home", "about", "seo", "support", "legal"];
const MAX_VERSIONS = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_SUPPORT = {
  email: "team@skybirdssolution.com",
  mobile: "+91 70414 92302",
  location: "SkyBirds solution, 2nd floor, Green Palladia, 218, opp. Raj World Shopping Center, Palanpur, Surat, Gujarat 395009",
  heading: "How Can Our Marketplace Team Help You?",
  description: "Have questions about our video courses, seller onboarding services, or account management? Send us a message and our specialists will respond promptly.",
  responseTime: "Typical response time: Under 4 business hours",
};

const DEFAULT_LEGAL = {
  privacy: "Your privacy policy content can be managed from the admin panel.",
  terms: "Your terms & conditions content can be managed from the admin panel.",
};

async function getOrCreate() {
  let doc = await SiteContent.findOne({ key: "main" });
  if (!doc) {
    doc = await SiteContent.create({
      key: "main",
      ...DEFAULTS,
      support: { ...DEFAULT_SUPPORT, ...(DEFAULTS.support || {}) },
      legal: { ...DEFAULT_LEGAL, ...(DEFAULTS.legal || {}) },
    });
  }
  return doc;
}

exports.getPublicSiteContent = async (req, res) => {
  try {
    const doc = await getOrCreate();
    res.json({
      success: true,
      data: {
        home: doc.home || {},
        about: doc.about || {},
        seo: doc.seo || {},
        support: { ...DEFAULT_SUPPORT, ...(doc.support || {}), socialLinks: Array.isArray(doc.support?.socialLinks) ? doc.support.socialLinks : [] },
        legal: { ...DEFAULT_LEGAL, ...(doc.legal || {}) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminSiteContent = async (req, res) => {
  try {
    const doc = await getOrCreate();
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSiteContent = async (req, res) => {
  try {
    const allowed = ["home", "about", "seo", "support", "legal"];
    const update = {};

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        update[key] = req.body[key];
      }
    }

    const doc = await SiteContent.findOneAndUpdate(
      { key: "main" },
      { $set: update, $setOnInsert: { key: "main" } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, message: "Site content updated", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Defaults fill only what's missing, so every section has fields to edit and saved text always wins.
function withDefaults(defaults, saved) {
  if (!isPlainObject(defaults) || !isPlainObject(saved)) return saved === undefined ? defaults : saved;
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(saved)) merged[key] = withDefaults(defaults[key], value);
  return merged;
}

const contentWithDefaults = (source) =>
  Object.fromEntries(SECTIONS.map((key) => [key, withDefaults({ ...(key === "legal" ? DEFAULT_LEGAL : {}), ...DEFAULTS[key] }, source[key] || {})]));

const publishedContent = (doc) => contentWithDefaults(doc);

const hasUnsafeKey = (value) => {
  if (Array.isArray(value)) return value.some(hasUnsafeKey);
  if (!isPlainObject(value)) return false;
  return Object.entries(value).some(([key, item]) => key.startsWith("$") || key.includes(".") || hasUnsafeKey(item));
};

function draftProblem(content) {
  if (!isPlainObject(content)) return "Invalid content";
  if (Object.keys(content).some((key) => !SECTIONS.includes(key))) return "Unknown content section";
  if (SECTIONS.some((key) => !isPlainObject(content[key]))) return "Every content section is required";
  if (hasUnsafeKey(content)) return "Invalid field name";
  return null;
}

function isWebUrl(value) {
  try {
    return ["https:", "http:"].includes(new URL(String(value).trim()).protocol);
  } catch {
    return false;
  }
}

// What would visibly break the live site. Other blank fields fall back to the page's own text.
function publishProblems(content) {
  const problems = [];
  const blank = (value) => !String(value ?? "").trim();
  if (blank(content.seo.defaultTitle)) problems.push("SEO: the default title is required.");
  if (blank(content.legal.privacy)) problems.push("Privacy: the policy text is required.");
  if (blank(content.legal.terms)) problems.push("Terms: the terms text is required.");
  if (!EMAIL.test(String(content.support.email || "").trim())) problems.push("Contact: enter a valid email address.");
  if (content.support.telegramUrl && !isWebUrl(content.support.telegramUrl)) problems.push("Contact: the Telegram link must start with http:// or https://.");
  (Array.isArray(content.support.socialLinks) ? content.support.socialLinks : []).forEach((link, index) => {
    if (link?.url && !isWebUrl(link.url)) problems.push(`Social link ${index + 1}: the URL must start with http:// or https://.`);
  });
  (content.home.faqs || []).forEach((faq, index) => {
    if (blank(faq?.q) || blank(faq?.a)) problems.push(`FAQ item ${index + 1}: both the question and the answer are required.`);
  });
  (content.home.contentSections || []).forEach((section, index) => {
    if (blank(section?.title)) problems.push(`Content section ${index + 1}: the title is required.`);
  });
  return problems;
}

const CONFLICT = "This content was changed in another tab or by another admin. Refresh the page to continue.";

// @route   GET /api/admin/site-content/editor
exports.getEditorContent = async (req, res) => {
  try {
    const doc = await getOrCreate();
    res.json({
      success: true,
      data: {
        // Older drafts get any fields added since they were saved.
        content: doc.draft ? contentWithDefaults(doc.draft) : publishedContent(doc),
        hasDraft: Boolean(doc.draft),
        revision: doc.draftRevision || 0,
        draftUpdatedAt: doc.draftUpdatedAt,
        publishedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    console.error("Load website editor failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to load website content" });
  }
};

// @route   PUT /api/admin/site-content/draft
exports.saveDraft = async (req, res) => {
  try {
    const { content, revision } = req.body || {};
    const problem = draftProblem(content);
    if (problem) return res.status(400).json({ success: false, message: problem });
    await getOrCreate();
    const now = new Date();
    const doc = await SiteContent.findOneAndUpdate(
      { key: "main", draftRevision: revisionFilter(revision) },
      { $set: { draft: content, draftUpdatedAt: now }, $inc: { draftRevision: 1 } },
      { new: true }
    );
    if (!doc) return res.status(409).json({ success: false, message: CONFLICT });
    res.json({ success: true, revision: doc.draftRevision, draftUpdatedAt: now });
  } catch (error) {
    console.error("Save website draft failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to save the draft" });
  }
};

// Records created before drafts existed have no draftRevision yet.
function revisionFilter(revision) {
  const number = Number(revision) || 0;
  return number === 0 ? { $in: [0, null] } : number;
}

// @route   DELETE /api/admin/site-content/draft
exports.discardDraft = async (req, res) => {
  try {
    const doc = await SiteContent.findOneAndUpdate(
      { key: "main" },
      { $set: { draft: null, draftUpdatedAt: null }, $inc: { draftRevision: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true, timestamps: false }
    );
    res.json({ success: true, content: publishedContent(doc), revision: doc.draftRevision });
  } catch (error) {
    console.error("Discard website draft failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to discard the draft" });
  }
};

// @route   POST /api/admin/site-content/publish
exports.publishDraft = async (req, res) => {
  try {
    const current = await getOrCreate();
    if (!current.draft) return res.status(409).json({ success: false, message: "There are no changes to publish." });
    if ((current.draftRevision || 0) !== (Number(req.body?.revision) || 0)) return res.status(409).json({ success: false, message: CONFLICT });
    const problems = publishProblems(current.draft);
    if (problems.length) return res.status(400).json({ success: false, message: problems[0], problems });

    // Returns the previous content, so it can be kept for undo.
    const previous = await SiteContent.findOneAndUpdate(
      { key: "main", draftRevision: current.draftRevision },
      { $set: { ...current.draft, draft: null, draftUpdatedAt: null }, $inc: { draftRevision: 1 } },
      { new: false }
    );
    if (!previous) return res.status(409).json({ success: false, message: CONFLICT });

    try {
      await SiteContentVersion.create({
        content: Object.fromEntries(SECTIONS.map((key) => [key, previous[key] || {}])),
        replacedBy: req.admin?.email || "",
      });
      const stale = await SiteContentVersion.find().sort({ createdAt: -1, _id: -1 }).skip(MAX_VERSIONS).select("_id").lean();
      if (stale.length) await SiteContentVersion.deleteMany({ _id: { $in: stale.map((item) => item._id) } });
    } catch (error) {
      // The publish already succeeded; only the undo copy is missing.
      console.error("Save website version failed:", error.message);
    }
    res.json({ success: true, message: "Published", revision: previous.draftRevision + 1 });
  } catch (error) {
    console.error("Publish website content failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to publish" });
  }
};

// @route   GET /api/admin/site-content/versions
exports.getVersions = async (req, res) => {
  try {
    const data = await SiteContentVersion.find().sort({ createdAt: -1, _id: -1 }).limit(MAX_VERSIONS).select("replacedBy createdAt").lean();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Load website versions failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to load history" });
  }
};

// Puts an old version in the draft, to review and publish; the live site doesn't change yet.
// @route   POST /api/admin/site-content/versions/:id/restore
exports.restoreVersion = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).json({ success: false, message: "Version not found" });
    const version = await SiteContentVersion.findById(req.params.id).lean();
    if (!version) return res.status(404).json({ success: false, message: "Version not found" });
    const content = Object.fromEntries(SECTIONS.map((key) => [key, withDefaults(DEFAULTS[key], version.content[key] || {})]));
    await getOrCreate();
    const now = new Date();
    const doc = await SiteContent.findOneAndUpdate(
      { key: "main" },
      { $set: { draft: content, draftUpdatedAt: now }, $inc: { draftRevision: 1 } },
      { new: true }
    );
    res.json({ success: true, content, revision: doc.draftRevision, draftUpdatedAt: now });
  } catch (error) {
    console.error("Restore website version failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to restore this version" });
  }
};
