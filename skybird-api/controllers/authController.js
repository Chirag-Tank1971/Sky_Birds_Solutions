const crypto = require("crypto");
const https = require("https");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const OtpChallenge = require("../models/OtpChallenge");
const { otpEmail } = require("../services/otpEmail");

const OTP_RESEND_INTERVAL_MS = 60 * 1000;
// Keep in sync with the profession dropdown on the user site's sign-up tab.
const PROFESSIONS = ["Student", "Working professional", "Business owner", "Marketplace seller", "Other"];

// Returns the cleaned sign-up profile, or null if any field is missing or invalid.
// The verified mobile number or email comes from the OTP step, not from here.
function parseSignupProfile(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const age = Number(body?.age);
  const profession = typeof body?.profession === "string" ? body.profession.trim() : "";
  if (name.length < 2 || name.length > 100) return null;
  if (!Number.isInteger(age) || age < 13 || age > 100) return null;
  if (!PROFESSIONS.includes(profession)) return null;
  return { name, age, profession };
}

const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Authentication is not configured securely");
  }
  return jwt.sign({ id: String(id), role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
    issuer: "skybirds-api",
    audience: "skybirds-client",
  });
};

function sendApiTxtOtp(to, otp, expiresAt) {
  const authkey = process.env.APITXT_AUTH_KEY;
  const endpoint = process.env.APITXT_OTP_URL || "https://apitxt.com/api/sendOTP";
  const countryCode = String(process.env.APITXT_COUNTRY_CODE || "91").replace(/\D/g, "");
  if (!authkey || !/^https:\/\//i.test(endpoint) || !countryCode) {
    const error = new Error("APITxT OTP delivery is not configured. Please contact support.");
    error.statusCode = 503;
    return Promise.reject(error);
  }

  // The API key and OTP stay server-side. Never return the OTP to the browser.
  const payload = new URLSearchParams({
    authkey,
    mobile: `${countryCode}${to}`,
    otp, 
  }).toString();
  const target = new URL(endpoint);
  if (target.hostname !== "apitxt.com" && target.hostname !== "www.apitxt.com") {
    const error = new Error("APITxT OTP endpoint must use the official APITxT host.");
    error.statusCode = 500;
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(payload),
        Accept: "application/json",
      },
      timeout: 10000,
    }, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        if (data.length < 16384) data += chunk;
      });
      response.on("end", () => {
        let result;
        try { result = JSON.parse(data); } catch { result = null; }
        const httpOk = response.statusCode >= 200 && response.statusCode < 300;
        const apiStatus = String(result?.status ?? result?.type ?? "").toLowerCase();
        const apiMessage = String(result?.message ?? "").toLowerCase();
        const apiOk = result?.success === true || apiStatus === "200" || apiStatus === "success" || apiMessage === "success";
        if (httpOk && apiOk) return resolve();
        const error = new Error(`APITxT rejected OTP delivery (HTTP ${response.statusCode || 0}).`);
        error.statusCode = httpOk ? 502 : 503;
        reject(error);
      });
    });
    request.on("timeout", () => request.destroy(new Error("APITxT OTP request timed out")));
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A customer signs in with a 10-digit mobile number or an email address.
// Older clients send the value as `mobile`, so that key is still accepted.
function parseIdentifier(body) {
  const raw = String(body?.identifier ?? body?.mobile ?? "").trim();
  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    return email.length <= 254 && EMAIL_RE.test(email) ? { field: "email", value: email } : null;
  }
  const mobile = raw.replace(/\D/g, "");
  return /^\d{10}$/.test(mobile) ? { field: "mobile", value: mobile } : null;
}

const accountQuery = (id) => ({ [id.field]: id.value });
const publicUser = (user) => ({ id: user._id, mobile: user.mobile || "", email: user.email || "", name: user.name, role: user.role });

// Sends the OTP by email through Resend's REST API.
async function sendEmailOtp(to, otp, expiresAt, purpose) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    const error = new Error("Email OTP is not available right now. Please use your mobile number or contact support.");
    error.statusCode = 503;
    throw error;
  }
  const minutes = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 60000));
  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        ...otpEmail({ otp, minutes, purpose }),
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    const error = new Error("Unable to send the email right now. Please try again.");
    error.statusCode = 503;
    throw error;
  }
  if (!response.ok) {
    // Resend explains the rejection (e.g. unverified domain); log it, never send it to the browser.
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    const error = new Error(`Resend rejected OTP email (HTTP ${response.status}): ${detail}`);
    error.statusCode = 502;
    throw error;
  }
}

function hashOtp(identifier, otp) {
  const pepper = process.env.OTP_PEPPER || process.env.JWT_SECRET;
  if (!pepper || pepper.length < 32) throw new Error("OTP security is not configured");
  return crypto.createHash("sha256").update(`${identifier}:${otp}:${pepper}`).digest("hex");
}

function issuePurposeToken(identifier, purpose) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Authentication is not configured securely");
  }
  const jti = crypto.randomBytes(24).toString("hex");
  const token = jwt.sign(
    { identifier, purpose, jti },
    process.env.JWT_SECRET,
    { expiresIn: "10m", issuer: "skybirds-api", audience: "skybirds-client" }
  );
  return { token, jti };
}

function readPurposeToken(token, purpose, identifier) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "skybirds-api",
      audience: "skybirds-client",
    });
    return payload.purpose === purpose && payload.identifier === identifier && payload.jti
      ? payload
      : null;
  } catch {
    return null;
  }
}

function verifyPurposeToken(token, purpose, identifier) {
  return Boolean(readPurposeToken(token, purpose, identifier));
}

function validPassword(password) {
  return typeof password === "string" && password.length >= 8 &&
    password.length <= 128 && !/[\u0000-\u001F\u007F]/.test(password);
}

const NO_ACCOUNT = "No account found for this mobile number or email.";
const VERIFY_AGAIN = "Verify your mobile number or email again.";

exports.sendOtp = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    const purpose = req.body?.purpose === "reset" ? "reset" : "register";
    if (!id) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number or email address" });
    }

    const existingUser = await User.findOne(accountQuery(id)).select("_id");
    if (purpose === "register" && existingUser) {
      // Preserve endpoint compatibility while avoiding an unnecessary OTP for registered users.
      return res.status(200).json({ success: true, existingUser: true, message: "Please sign in with your password." });
    }
    if (purpose === "reset" && !existingUser) {
      return res.status(404).json({ success: false, message: NO_ACCOUNT });
    }

    // At most one OTP per number or email per minute, whatever IP the requests come from.
    const previous = await OtpChallenge.findOne({ identifier: id.value }).select("createdAt");
    const waitMs = previous?.createdAt ? OTP_RESEND_INTERVAL_MS - (Date.now() - previous.createdAt.getTime()) : 0;
    if (waitMs > 0) {
      const seconds = Math.ceil(waitMs / 1000);
      res.set("Retry-After", String(seconds));
      return res.status(429).json({ success: false, message: `Please wait ${seconds} seconds before requesting another OTP.`, retryAfter: seconds });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashOtp(id.value, otp);
    const expiresAt = new Date(Date.now() + Math.min(10, Math.max(2, Number(process.env.OTP_EXPIRE_MINUTES) || 5)) * 60 * 1000);

    await OtpChallenge.deleteOne({ identifier: id.value });
    if (id.field === "email") await sendEmailOtp(id.value, otp, expiresAt, purpose);
    else await sendApiTxtOtp(id.value, otp, expiresAt);
    await OtpChallenge.findOneAndUpdate(
      { identifier: id.value },
      { $set: { codeHash, purpose, expiresAt, attempts: 0, createdAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({
      success: true,
      message: id.field === "email" ? "OTP sent to your email" : "OTP sent successfully",
      existingUser: !!existingUser,
    });
  } catch (error) {
    const status = Number(error.statusCode) || 503;
    console.error("OTP delivery failed:", error.message);
    return res.status(status).json({
      success: false,
      message: status === 503 ? error.message : "Unable to send OTP right now",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    const otp = String(req.body?.otp || "").trim();
    const purpose = req.body?.purpose === "reset" ? "reset" : "register";
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 100) : "";
    if (!id || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Please provide a valid mobile number or email and 6-digit OTP" });
    }

    const challenge = await OtpChallenge.findOne({ identifier: id.value, purpose });
    if (!challenge || challenge.expiresAt <= new Date()) {
      if (challenge) await OtpChallenge.deleteOne({ _id: challenge._id });
      return res.status(400).json({ success: false, message: "OTP expired or not requested. Please request a new OTP." });
    }

    const attempt = await OtpChallenge.findOneAndUpdate(
      { _id: challenge._id, attempts: { $lt: 5 }, expiresAt: { $gt: new Date() }, purpose },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (!attempt) {
      await OtpChallenge.deleteOne({ identifier: id.value, purpose, attempts: { $gte: 5 } });
      return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
    }

    const supplied = Buffer.from(hashOtp(id.value, otp), "hex");
    const expected = Buffer.from(attempt.codeHash, "hex");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      if (attempt.attempts >= 5) await OtpChallenge.deleteOne({ _id: attempt._id });
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const consumed = await OtpChallenge.findOneAndDelete({
      _id: attempt._id,
      codeHash: attempt.codeHash,
      purpose,
    });
    if (!consumed) {
      return res.status(400).json({ success: false, message: "OTP already used. Please request a new OTP." });
    }

    const user = await User.findOne(accountQuery(id)).select("_id isBlocked");
    if (purpose === "register" && user) {
      return res.status(409).json({ success: false, message: "An account already exists. Please sign in with your password." });
    }
    if (purpose === "reset" && !user) {
      return res.status(404).json({ success: false, message: NO_ACCOUNT });
    }
    if (user?.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Contact support." });
    }

    const issued = issuePurposeToken(id.value, purpose === "reset" ? "password_reset" : "password_setup");
    if (purpose === "reset") {
      const resetUser = await User.findOne(accountQuery(id)).select("+passwordResetJti");
      if (!resetUser || resetUser.isBlocked) {
        return res.status(resetUser ? 403 : 404).json({
          success: false,
          message: resetUser ? "Your account has been blocked. Contact support." : NO_ACCOUNT,
        });
      }
      resetUser.passwordResetJti = issued.jti;
      await resetUser.save();
    }
    return res.status(200).json({
      success: true,
      verified: true,
      message: id.field === "email" ? "Email verified" : "Mobile number verified",
      verificationToken: issued.token,
      purpose,
      name,
    });
  } catch (error) {
    console.error("OTP verification failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to verify OTP right now" });
  }
};

exports.customerLogin = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    const password = String(req.body?.password || "");
    if (!id || !password || password.length > 128) {
      return res.status(400).json({ success: false, message: "Enter a valid mobile number or email and your password." });
    }
    const user = await User.findOne(accountQuery(id)).select("+passwordHash");
    // Sign-up and password reset already reveal whether an account exists, so say so plainly here too.
    if (!user) {
      return res.status(404).json({ success: false, message: `No account found with this ${id.field === "email" ? "email" : "mobile number"}. Please sign up first.` });
    }
    if (!user.passwordHash || !(await require("bcryptjs").compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Incorrect password. Try again or use Forgot password." });
    }
    if (user.isBlocked) return res.status(403).json({ success: false, message: "Your account has been blocked. Contact support." });
    const token = generateToken(user._id, "customer");
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Customer login failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to log in right now" });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    const password = req.body?.password;
    const verificationToken = String(req.body?.verificationToken || "");
    if (!id || !validPassword(password) ||
        !verifyPurposeToken(verificationToken, "password_setup", id.value)) {
      return res.status(400).json({ success: false, message: `Verification expired or password is invalid. ${VERIFY_AGAIN}` });
    }
    const alreadyExists = await User.findOne(accountQuery(id)).select("_id");
    if (alreadyExists) return res.status(409).json({ success: false, message: "An account already exists. Please sign in or reset your password." });

    const profile = parseSignupProfile(req.body);
    if (!profile) {
      return res.status(400).json({ success: false, message: "Please fill in your name, age and profession." });
    }

    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ ...accountQuery(id), ...profile, passwordHash });
    const token = generateToken(user._id, "customer");
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "An account already exists. Please sign in." });
    console.error("Set customer password failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to create your account right now" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    const password = req.body?.password;
    const verificationToken = String(req.body?.verificationToken || "");
    if (!id || !validPassword(password) ||
        !verifyPurposeToken(verificationToken, "password_reset", id.value)) {
      return res.status(400).json({ success: false, message: `Verification expired or password is invalid. ${VERIFY_AGAIN}` });
    }
    const tokenPayload = readPurposeToken(verificationToken, "password_reset", id.value);
    if (!tokenPayload) {
      return res.status(400).json({ success: false, message: `Verification expired or invalid. ${VERIFY_AGAIN}` });
    }
    const user = await User.findOne(accountQuery(id)).select("+passwordHash +passwordResetJti");
    if (!user) return res.status(404).json({ success: false, message: NO_ACCOUNT });
    if (user.isBlocked) return res.status(403).json({ success: false, message: "Your account has been blocked. Contact support." });
    if (!user.passwordResetJti || user.passwordResetJti !== tokenPayload.jti) {
      return res.status(400).json({ success: false, message: `Reset token has already been used or replaced. ${VERIFY_AGAIN}` });
    }
    const passwordHash = await require("bcryptjs").hash(password, 12);
    const updated = await User.updateOne(
      { _id: user._id, passwordResetJti: tokenPayload.jti },
      // passwordChangedAt signs out every session issued before this reset.
      { $set: { passwordHash, passwordChangedAt: new Date() }, $unset: { passwordResetJti: 1 } }
    );
    if (!updated.modifiedCount) {
      return res.status(400).json({ success: false, message: `Reset token has already been used. ${VERIFY_AGAIN}` });
    }
    return res.status(200).json({ success: true, message: "Password reset successfully. Please log in with your new password." });
  } catch (error) {
    console.error("Password reset failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to reset password right now" });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password || email.length > 254 || password.length > 256) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    // Never accept the publicly disclosed demo password, even if an old seeded account still uses it.
    if (password === "admin123") return res.status(401).json({ success: false, message: "Invalid credentials" });
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(admin._id, "admin");
    return res.status(200).json({ success: true, message: "Admin login successful", token, admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (error) {
    console.error("Admin login failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to log in right now" });
  }
};
