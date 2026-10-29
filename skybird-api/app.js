const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("./middleware/rateLimit");
const { razorpayWebhook } = require("./controllers/paymentController");

const adminCouponRoutes = require("./routes/adminCouponRoutes");
const couponRoutes = require("./routes/couponRoutes");

const app = express();

const allowedOrigins = (
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  // Browsers send origins without a trailing slash, so ignore one in the env value.
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  if (process.env.NODE_ENV === "production")
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
      skip: (req) => req.path.includes("/videos/"),
    }),
  );
}

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many API requests. Please try again later.",
  }),
);
app.use(
  "/api/auth/customer/send-otp",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: "Too many OTP requests. Please try again later.",
  }),
);
app.use(
  "/api/auth/customer/verify-otp",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many OTP attempts. Please try again later.",
  }),
);
app.use(
  "/api/auth/customer/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts. Please try again later.",
  }),
);
app.use(
  "/api/auth/customer/reset-password",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many password reset attempts. Please try again later.",
  }),
);
app.use(
  "/api/auth/admin/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    message: "Too many login attempts. Please try again later.",
  }),
);
app.use(
  "/api/contact",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many contact submissions. Please try again later.",
  }),
);

// Razorpay signs the exact request bytes, so this route must read the raw body
// before the JSON parser below consumes it.
app.post(
  "/api/payment/razorpay/webhook",
  express.raw({ type: "*/*", limit: "1mb" }),
  razorpayWebhook,
);

app.use(express.json({ limit: "1mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "1mb", parameterLimit: 1000 }),
);

app.use(
  "/uploads/thumbnails",
  express.static(path.join(__dirname, "uploads", "thumbnails"), {
    fallthrough: false,
    index: false,
    dotfiles: "deny",
    maxAge: "1d",
    immutable: false,
  }),
);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/platforms", require("./routes/platforms"));
app.use("/api/customer", require("./routes/customer"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/site", require("./routes/site"));
app.use("/api/testimonials", require("./routes/testimonials"));
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/coupons", couponRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SkyBirds E-Commerce Course Platform API is running 🚀",
    version: "2.0.0",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.message === "CORS origin not allowed")
    return res
      .status(403)
      .json({ success: false, message: "Origin not allowed" });
  if (err.name === "MulterError" || err.statusCode === 413)
    return res
      .status(413)
      .json({
        success: false,
        message: "Uploaded file or request is too large",
      });
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500)
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  console.error("Unhandled API error:", err.message);
  return res
    .status(500)
    .json({ success: false, message: "Server error. Please try again later." });
});

module.exports = app;
