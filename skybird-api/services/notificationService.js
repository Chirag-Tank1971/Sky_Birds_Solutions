const fs = require("fs");
const path = require("path");
const Contact = require("../models/Contact");
const Course = require("../models/Course");
const Coupon = require("../models/Coupon");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { isConfigured: cloudinaryConfigured } = require("../config/cloudinary");
const { videoDir, validateVideoId, listVideoJobs } = require("./videoService");

const ACTIVITY_DAYS = 30;
const ACTIVITY_LIMIT = 50;
const COUPON_EXPIRY_WARNING_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const rupees = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const customerLabel = (name, mobile) => (name ? `${name} (+91 ${mobile})` : `+91 ${mobile}`);

// Things that happened recently: new queries, purchases and sign-ups.
async function recentActivity(since) {
  const [contacts, payments, users] = await Promise.all([
    Contact.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(ACTIVITY_LIMIT).select("name subject status createdAt").lean(),
    Payment.find({ status: "paid", paidAt: { $gte: since } }).sort({ paidAt: -1 }).limit(ACTIVITY_LIMIT)
      .select("userMobile courseTitle finalAmount provider couponCode paidAt").lean(),
    User.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(ACTIVITY_LIMIT).select("name mobile createdAt").lean(),
  ]);

  const items = [
    ...contacts.map((contact) => ({
      id: `contact:${contact._id}`,
      type: "query",
      title: "New contact query",
      message: `${contact.name}: ${contact.subject}`,
      link: "/queries",
      createdAt: contact.createdAt,
    })),
    ...payments.map((payment) => ({
      id: `payment:${payment._id}`,
      type: "purchase",
      title: payment.provider === "free" ? "Course unlocked for free" : "New course purchase",
      message: `+91 ${payment.userMobile || "unknown"} · ${payment.courseTitle || "a course"}` +
        (payment.provider === "free" ? "" : ` · ${rupees(payment.finalAmount)}`) +
        (payment.couponCode ? ` · coupon ${payment.couponCode}` : ""),
      link: "/customers",
      createdAt: payment.paidAt,
    })),
    ...users.map((user) => ({
      id: `user:${user._id}`,
      type: "signup",
      title: "New customer sign-up",
      message: customerLabel(user.name, user.mobile),
      link: "/customers",
      createdAt: user.createdAt,
    })),
  ];

  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, ACTIVITY_LIMIT);
}

// Problems with the website that stay listed until they are fixed.
async function websiteAlerts(admin) {
  const alerts = [];
  const now = Date.now();

  // Lesson videos: missing files (wiped disk) or no video attached.
  const courses = await Course.find({ isActive: true }).select("id title videos").lean();
  let missingFiles = 0;
  let noVideo = 0;
  const affected = new Set();
  const processing = new Set(listVideoJobs().filter((job) => job.status !== "failed").map((job) => job.videoId));
  for (const course of courses) {
    for (const lesson of course.videos || []) {
      if (!lesson.videoId) {
        noVideo += 1;
        affected.add(course.title);
      } else if (!processing.has(lesson.videoId) && (!validateVideoId(lesson.videoId) || !fs.existsSync(path.join(videoDir(lesson.videoId), "master.m3u8")))) {
        missingFiles += 1;
        affected.add(course.title);
      }
    }
  }
  if (missingFiles) {
    alerts.push({
      id: "videos-missing",
      level: "error",
      title: `${missingFiles} lesson video${missingFiles === 1 ? " is" : "s are"} missing on the server`,
      message: `Students can't play ${missingFiles === 1 ? "it" : "them"}. Re-upload in: ${[...affected].slice(0, 3).join(", ")}${affected.size > 3 ? "…" : ""}. Check that video storage is on a persistent disk.`,
      link: "/courses",
    });
  }
  if (noVideo) {
    alerts.push({
      id: "videos-none",
      level: "warning",
      title: `${noVideo} lesson${noVideo === 1 ? " has" : "s have"} no video`,
      message: "Upload a video for these lessons in the course editor.",
      link: "/courses",
    });
  }

  const jobs = listVideoJobs();
  const failedJobs = jobs.filter((job) => job.status === "failed").length;
  const activeJobs = jobs.length - failedJobs;
  if (failedJobs) {
    alerts.push({
      id: "videos-failed",
      level: "error",
      title: `${failedJobs} video upload${failedJobs === 1 ? "" : "s"} failed to process`,
      message: "Upload the file again from the course editor.",
      link: "/courses",
    });
  }
  if (activeJobs) {
    alerts.push({
      id: "videos-processing",
      level: "info",
      title: `${activeJobs} video${activeJobs === 1 ? " is" : "s are"} processing`,
      message: "They will be playable when processing finishes.",
      link: "/courses",
    });
  }

  // Configuration the site depends on.
  const config = [
    [!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET, "error", "Payments are not configured", "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server. Students can't buy courses."],
    [!process.env.RAZORPAY_WEBHOOK_SECRET, "warning", "Razorpay webhook is not set up", "Without it, a student whose browser closes after paying doesn't get the course. Add the webhook in Razorpay and set RAZORPAY_WEBHOOK_SECRET."],
    [!process.env.APITXT_AUTH_KEY, "error", "SMS OTP is not configured", "Set APITXT_AUTH_KEY on the server. New students can't register or reset passwords."],
    [!cloudinaryConfigured(), "warning", "Cloudinary is not configured", "Course thumbnail uploads won't be stored properly. Set the CLOUDINARY_* settings."],
    [process.env.NODE_ENV === "production" && process.env.TRUST_PROXY !== "true", "warning", "TRUST_PROXY is off", "Behind Render or Cloudflare every visitor looks the same, so OTP limits block real users. Set TRUST_PROXY=true."],
  ];
  config.forEach(([problem, level, title, message], index) => {
    if (problem) alerts.push({ id: `config-${index}`, level, title, message, link: "" });
  });

  if (admin?.email === "admin@example.com") {
    alerts.push({
      id: "admin-default-email",
      level: "warning",
      title: "Admin login uses the default email",
      message: "admin@example.com was shown publicly on the old login page. Use a strong password, and consider switching to your own email.",
      link: "",
    });
  }

  // Coupons that have stopped working, or soon will.
  const coupons = await Coupon.find({ status: "active" }).select("code usageLimit usedCount expiresAt").lean();
  for (const coupon of coupons) {
    const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() : null;
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      alerts.push({ id: `coupon-used-${coupon._id}`, level: "info", title: `Coupon ${coupon.code} is used up`, message: `All ${coupon.usageLimit} uses are taken.`, link: "/coupons" });
    } else if (expiresAt && expiresAt < now) {
      alerts.push({ id: `coupon-expired-${coupon._id}`, level: "info", title: `Coupon ${coupon.code} has expired`, message: "It is still marked active but no longer works.", link: "/coupons" });
    } else if (expiresAt && expiresAt - now < COUPON_EXPIRY_WARNING_DAYS * DAY_MS) {
      alerts.push({ id: `coupon-expiring-${coupon._id}`, level: "info", title: `Coupon ${coupon.code} expires soon`, message: `Expires ${new Date(expiresAt).toLocaleDateString("en-IN")}.`, link: "/coupons" });
    }
  }

  const order = { error: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.level] - order[b.level]);
}

async function getNotifications(admin) {
  const since = new Date(Date.now() - ACTIVITY_DAYS * DAY_MS);
  const readAt = admin?.notificationsReadAt ? new Date(admin.notificationsReadAt) : null;
  const [activity, alerts] = await Promise.all([recentActivity(since), websiteAlerts(admin)]);
  const items = activity.map((item) => ({ ...item, unread: !readAt || new Date(item.createdAt) > readAt }));
  return {
    items,
    alerts,
    unreadCount: items.filter((item) => item.unread).length,
    readAt,
  };
}

module.exports = { getNotifications };
