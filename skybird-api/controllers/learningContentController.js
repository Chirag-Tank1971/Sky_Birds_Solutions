const Course = require("../models/Course");
const LearningContent = require("../models/LearningContent");

const { CONTENT_TYPES } = LearningContent;
const OBJECT_ID = /^[a-f\d]{24}$/i;

// These links are shown as clickable to students, so only web addresses are accepted.
const webUrl = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  try {
    const { protocol } = new URL(text);
    return protocol === "https:" || protocol === "http:" ? text : null;
  } catch {
    return null;
  }
};

// Returns { data } with only the allowed fields, or { error }.
async function readBody(body) {
  const type = String(body?.type || "");
  if (!CONTENT_TYPES.includes(type)) return { error: "Invalid content type" };
  const title = String(body?.title ?? "").trim();
  if (!title) return { error: "Title is required" };
  if (title.length > 200) return { error: "Title is too long" };
  const description = String(body?.description ?? "").trim();
  if (description.length > 2000) return { error: "Description is too long" };

  const url = webUrl(body?.url);
  if (url === null) return { error: "Link must start with http:// or https://" };

  const thumbnail = webUrl(body?.thumbnail);
  if (thumbnail === null) return { error: "Image must be an uploaded image or a web link" };

  let course = null;
  if (body?.course) {
    if (!OBJECT_ID.test(String(body.course)) || !(await Course.exists({ _id: body.course }))) return { error: "Course not found" };
    course = body.course;
  }

  const data = { type, title, description, url, thumbnail, course, isPublished: body?.isPublished === true };
  if (type === "session") {
    const startsAt = new Date(body?.startsAt);
    if (!body?.startsAt || Number.isNaN(startsAt.getTime())) return { error: "Session date and time are required" };
    const durationMinutes = Number(body?.durationMinutes ?? 60);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) return { error: "Duration must be between 1 and 1440 minutes" };
    const recordingUrl = webUrl(body?.recordingUrl);
    if (recordingUrl === null) return { error: "Recording link must start with http:// or https://" };
    Object.assign(data, { startsAt, durationMinutes, recordingUrl });
  } else if (!url) {
    return { error: "Link is required" };
  }
  return { data };
}

exports.getContentAdmin = async (req, res) => {
  try {
    const filter = CONTENT_TYPES.includes(req.query.type) ? { type: req.query.type } : {};
    const data = await LearningContent.find(filter).populate("course", "title").sort({ startsAt: -1, createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Load learning content failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load content" });
  }
};

exports.createContent = async (req, res) => {
  try {
    const { data, error } = await readBody(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const item = await LearningContent.create(data);
    return res.status(201).json({ success: true, message: "Saved", data: item });
  } catch (error) {
    console.error("Create learning content failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to save" });
  }
};

exports.updateContent = async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(404).json({ success: false, message: "Not found" });
    const { data, error } = await readBody(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const item = await LearningContent.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, message: "Saved", data: item });
  } catch (error) {
    console.error("Update learning content failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to save" });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    if (!OBJECT_ID.test(req.params.id)) return res.status(404).json({ success: false, message: "Not found" });
    const item = await LearningContent.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Delete learning content failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to delete" });
  }
};

// @desc    What this student may see: published items for everyone or for a course they bought
// @route   GET /api/customer/learning-content/:type
exports.getContentForCustomer = async (req, res) => {
  try {
    const { type } = req.params;
    if (!CONTENT_TYPES.includes(type)) return res.status(404).json({ success: false, message: "Not found" });
    const owned = req.user.purchasedCourses.map((item) => item.course).filter(Boolean);
    const items = await LearningContent.find({ type, isPublished: true, course: { $in: [null, ...owned] } })
      .populate("course", "title")
      .sort({ startsAt: 1, createdAt: -1 })
      .lean();
    const now = Date.now();
    const data = items.map((item) => {
      const ended = type === "session" && new Date(item.startsAt).getTime() + item.durationMinutes * 60000 < now;
      return {
        id: item._id,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail || "",
        // A finished session's join link is no longer useful, so it isn't sent.
        url: ended ? "" : item.url,
        courseTitle: item.course?.title || "",
        startsAt: item.startsAt,
        durationMinutes: item.durationMinutes,
        recordingUrl: item.recordingUrl,
        ended,
      };
    });
    res.set("Cache-Control", "private, no-store");
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Load student content failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load content" });
  }
};
