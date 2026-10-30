const jwt = require("jsonwebtoken");
const Course = require("../models/Course");
const bunnyStream = require("../services/bunnyStream");
const User = require("../models/User");
const Admin = require("../models/Admin");
const { createPlaybackToken } = require("../services/playbackService");
const { issuedBeforePasswordChange } = require("../middleware/auth");

const verifyAuthUser = async (req) => {
  // The 7-day login token is accepted only from the header, never from the URL,
  // so it does not end up in server or proxy logs.
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "skybirds-api", audience: "skybirds-client" });
    if (decoded.role === "admin") {
      const admin = await Admin.findById(decoded.id);
      if (admin) return { user: admin, role: "admin" };
    }
    const user = await User.findById(decoded.id).select("+passwordChangedAt");
    if (user && !user.isBlocked && !issuedBeforePasswordChange(user, decoded)) return { user, role: "customer" };
    return null;
  } catch (err) {
    return null;
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const { platform, level, search } = req.query;
    // Catalogue shows live and upcoming courses.
    const filter = { $and: [Course.listedFilter()] };

    // String() stops values like ?level[$ne]=x being treated as query operators.
    if (platform && platform !== "all") filter.platform = String(platform);
    if (level) filter.level = String(level);
    if (search) {
      const safeSearch = String(search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$and.push({
        $or: [
          { title: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
        ],
      });
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 }).lean();
    const safeCourses = courses.map((course) => ({
      ...course,
      status: Course.statusOf(course),
      videoUrl: "",
      videos: (course.videos || []).map((video) => ({
        id: video.id,
        title: video.title,
        duration: video.duration || "",
        videoId: video.upcoming ? "" : video.videoId || "",

        upcoming: Boolean(video.upcoming),

        provider: video.provider || "local",
      })),
    }));

    res.status(200).json({
      success: true,
      count: safeCourses.length,
      data: safeCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const requestedId = String(req.params.id || "").slice(0, 120);
    // Live, upcoming and private (direct link) courses open; unlive ones don't.
    let course = await Course.findOne({ id: requestedId, ...Course.viewableFilter() }).lean();
    if (!course && /^[a-f\d]{24}$/i.test(requestedId)) course = await Course.findById(requestedId).lean();

    if (!course || !Course.isViewable(course)) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Never expose legacy link/videoUrl values to customer-facing clients.
    course.videoUrl = "";
    course.status = Course.statusOf(course);
    course.videos = (course.videos || []).map((video) => ({
      id: video.id,
      title: video.title,
      duration: video.duration || "",
      videoId: video.upcoming ? "" : video.videoId || "",

      upcoming: Boolean(video.upcoming),

      provider: video.provider || "local",
    }));

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load course" });
  }
};

exports.createPlaybackAuthorization = async (req, res) => {
  try {
    const auth = await verifyAuthUser(req);
    if (!auth) return res.status(401).json({ success: false, message: "Authentication required" });

    const { id, videoId } = req.params;
    const safeId = String(id || "").slice(0, 120);
    // Buyers keep access in every status (even unlive); the purchase check below decides.
    const course = await Course.findOne({ id: safeId }) || (/^[a-f\d]{24}$/i.test(safeId) ? await Course.findById(safeId) : null);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (auth.role !== "admin") {
      const owned = auth.user.purchasedCourses.some(
        (item) => item.course && item.course.toString() === course._id.toString()
      );
      if (!owned) return res.status(403).json({ success: false, message: "Please purchase this course to stream video" });
    }

    const lesson = (course.videos || []).find((v) => v.id === videoId);
    if (lesson?.upcoming) return res.status(403).json({ success: false, message: "This lesson is coming soon." });
    const secureVideoId = lesson?.videoId || (course.videos?.length === 0 ? "" : null);
    if (!secureVideoId) return res.status(404).json({ success: false, message: "Video not found for this course" });

    // Bunny Stream lessons play in Bunny's embed player through a short-lived signed link.
    if (lesson?.provider === "bunny") {
      if (!bunnyStream.isConfigured()) return res.status(503).json({ success: false, message: "Video service is not available" });
      res.set("Cache-Control", "private, no-store");
      return res.status(200).json({ success: true, provider: "bunny", ...bunnyStream.embedUrl(secureVideoId) });
    }

    const token = createPlaybackToken({
      userId: auth.user._id.toString(),
      courseId: course._id.toString(),
      videoId: secureVideoId,
      role: auth.role,
    });

    res.set("Cache-Control", "private, no-store");
    return res.status(200).json({
      success: true,
      token,
      expiresIn: Number(process.env.PLAYBACK_TOKEN_TTL_SECONDS || 300),
      masterUrl: `/api/videos/${secureVideoId}/master.m3u8`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to authorize playback" });
  }
};

