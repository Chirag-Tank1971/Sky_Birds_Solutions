const crypto = require("crypto");
const https = require("https");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const OtpChallenge = require("../models/OtpChallenge");
const { otpEmail } = require("../services/otpEmail");
const { parseProfile } = require("../services/profile");

const OTP_RESEND_INTERVAL_MS = 60 * 1000;
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
        // Log APITxT's own reason (bad key, balance, IP or template) for us; customers get a generic 502 message.
        const error = new Error(`APITxT rejected OTP delivery (HTTP ${response.statusCode || 0}): ${data.slice(0, 300)}`);
        error.statusCode = 502;
        reject(error);
      });
    });
    request.on("timeout", () => request.destroy(new Error("APITxT OTP request timed out")));
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}


// Sends our OTP by SMS through MSG91's OTP API. Without MSG91_TEMPLATE_ID, MSG91 uses its shared
// default template; set it once your own DLT template is approved to send branded messages.
async function sendMsg91Otp(to, otp, expiresAt) {
  const countryCode = String(process.env.MSG91_COUNTRY_CODE || "91").replace(/\D/g, "");
  const params = new URLSearchParams({
    mobile: `${countryCode}${to}`,
    otp,
    otp_expiry: String(Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 60000))),
  });
  if (process.env.MSG91_TEMPLATE_ID) params.set("template_id", process.env.MSG91_TEMPLATE_ID.trim());

  let response;
  let body = "";
  try {
    response = await fetch(`https://control.msg91.com/api/v5/otp?${params}`, {
      method: "POST",
      headers: { authkey: process.env.MSG91_AUTH_KEY.trim(), accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    body = await response.text();
  } catch {
    const error = new Error("Unable to send the SMS right now. Please try again.");
    error.statusCode = 503;
    throw error;
  }
  let result = null;
  try { result = JSON.parse(body); } catch { /* MSG91 replied with non-JSON */ }
  if (response.ok && String(result?.type).toLowerCase() === "success") {
    // MSG91's request id lets us find this exact SMS in MSG91 → Reports when delivery fails later.
    console.log(`MSG91 accepted OTP SMS (request_id ${result.request_id || result.message || "n/a"}, template ${process.env.MSG91_TEMPLATE_ID ? "custom" : "default"})`);
    return;
  }
  // Log MSG91's own reason for us; customers get a generic 502 message.
  const error = new Error(`MSG91 rejected OTP delivery (HTTP ${response.status}): ${body.slice(0, 300)}`);
  error.statusCode = 502;
  throw error;
}

// MSG91 OTP Widget mode: without DLT, MSG91 sends OTPs only through its widget. The browser runs the widget
// (sends + checks the code) and gets an access token; we confirm it here and that it was for this number.
const widgetConfig = () =>
  process.env.MSG91_AUTH_KEY && process.env.MSG91_WIDGET_ID && process.env.MSG91_WIDGET_TOKEN
    ? { widgetId: process.env.MSG91_WIDGET_ID.trim(), tokenAuth: process.env.MSG91_WIDGET_TOKEN.trim() }
    : null;

async function verifyMsg91WidgetToken(id, accessToken) {
  if (typeof accessToken !== "string" || !accessToken || accessToken.length > 4096) {
    throw clientError(400, "Invalid verification. Please request a new OTP.");
  }
  let response;
  let body = "";
  try {
    response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ authkey: process.env.MSG91_AUTH_KEY.trim(), "access-token": accessToken }),
      signal: AbortSignal.timeout(10000),
    });
    body = await response.text();
  } catch {
    const error = new Error("Unable to verify the OTP right now. Please try again.");
    error.statusCode = 503;
    throw error;
  }
  let result = null;
  try { result = JSON.parse(body); } catch { /* non-JSON reply */ }
  // MSG91 answers HTTP 200 even for failures, so require type "success" and the verified number to match.
  const countryCode = String(process.env.MSG91_COUNTRY_CODE || "91").replace(/\D/g, "");
  const verified = String(result?.message ?? "").replace(/\D/g, "");
  if (response.ok && String(result?.type).toLowerCase() === "success" && verified === `${countryCode}${id.value}`) return;
  console.error(`MSG91 widget token not accepted (HTTP ${response.status}): ${body.slice(0, 300)}`);
  throw clientError(400, "OTP verification failed. Please request a new OTP.");
}

// Mobile OTP check: MSG91 widget token when widget mode is on, otherwise our own stored code.
async function confirmOtp(id, purpose, body) {
  if (id.field === "mobile" && widgetConfig()) return verifyMsg91WidgetToken(id, body?.accessToken);
  const otp = String(body?.otp || "").trim();
  if (!/^\d{6}$/.test(otp)) throw clientError(400, "Please provide a valid mobile number or email and 6-digit OTP");
  return consumeOtp(id, purpose, otp);
}

// MSG91 is used when configured; APITxT remains as the fallback SMS provider.
const sendSmsOtp = (to, otp, expiresAt) =>
  process.env.MSG91_AUTH_KEY ? sendMsg91Otp(to, otp, expiresAt) : sendApiTxtOtp(to, otp, expiresAt);

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
  // Hosting dashboards often keep pasted quotes, which Resend rejects as an invalid sender.
  const from = String(process.env.RESEND_FROM || "").trim().replace(/^["']|["']$/g, "").trim();
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

// Error with a message that is safe to show to the customer.
function clientError(status, message, extra) {
  return Object.assign(new Error(message), { statusCode: status, expose: true, extra });
}

// Rate-limits, stores and delivers a new OTP for this mobile number or email.
async function deliverOtp(id, purpose) {
  // At most one OTP per number or email per minute, whatever IP the requests come from.
  const previous = await OtpChallenge.findOne({ identifier: id.value }).select("createdAt");
  const waitMs = previous?.createdAt ? OTP_RESEND_INTERVAL_MS - (Date.now() - previous.createdAt.getTime()) : 0;
  if (waitMs > 0) {
    const seconds = Math.ceil(waitMs / 1000);
    throw clientError(429, `Please wait ${seconds} seconds before requesting another OTP.`, { retryAfter: seconds });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashOtp(id.value, otp);
  const expiresAt = new Date(Date.now() + Math.min(10, Math.max(2, Number(process.env.OTP_EXPIRE_MINUTES) || 5)) * 60 * 1000);

  await OtpChallenge.deleteOne({ identifier: id.value });
  if (id.field === "email") await sendEmailOtp(id.value, otp, expiresAt, purpose);
  else await sendSmsOtp(id.value, otp, expiresAt);
  await OtpChallenge.findOneAndUpdate(
    { identifier: id.value },
    { $set: { codeHash, purpose, expiresAt, attempts: 0, createdAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Checks the OTP and deletes it once used. Throws a clientError if it is wrong, expired or reused.
async function consumeOtp(id, purpose, otp) {
  const challenge = await OtpChallenge.findOne({ identifier: id.value, purpose });
  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) await OtpChallenge.deleteOne({ _id: challenge._id });
    throw clientError(400, "OTP expired or not requested. Please request a new OTP.");
  }

  const attempt = await OtpChallenge.findOneAndUpdate(
    { _id: challenge._id, attempts: { $lt: 5 }, expiresAt: { $gt: new Date() }, purpose },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!attempt) {
    await OtpChallenge.deleteOne({ identifier: id.value, purpose, attempts: { $gte: 5 } });
    throw clientError(429, "Too many incorrect attempts. Please request a new OTP.");
  }

  const supplied = Buffer.from(hashOtp(id.value, otp), "hex");
  const expected = Buffer.from(attempt.codeHash, "hex");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    if (attempt.attempts >= 5) await OtpChallenge.deleteOne({ _id: attempt._id });
    throw clientError(400, "Invalid OTP");
  }

  const consumed = await OtpChallenge.findOneAndDelete({ _id: attempt._id, codeHash: attempt.codeHash, purpose });
  if (!consumed) throw clientError(400, "OTP already used. Please request a new OTP.");
}

// Sends the error response for a failed OTP step without leaking internal details.
function otpFailure(res, error, logLabel, fallback) {
  if (error.expose) {
    if (error.extra?.retryAfter) res.set("Retry-After", String(error.extra.retryAfter));
    return res.status(error.statusCode).json({ success: false, message: error.message, ...(error.extra || {}) });
  }
  const status = Number(error.statusCode) || 503;
  console.error(`${logLabel}:`, error.message);
  // Delivery errors marked 503 carry a message written for users; anything else (e.g. a database error) stays in the log.
  return res.status(status).json({ success: false, message: error.statusCode === 503 ? error.message : fallback });
}

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

    // Widget mode: checks passed, so the browser's MSG91 widget sends the SMS itself.
    const widget = id.field === "mobile" ? widgetConfig() : null;
    if (widget) return res.status(200).json({ success: true, existingUser: !!existingUser, widget, message: "Sending OTP" });

    await deliverOtp(id, purpose);
    return res.status(200).json({
      success: true,
      message: id.field === "email" ? "OTP sent to your email" : "OTP sent successfully",
      existingUser: !!existingUser,
    });
  } catch (error) {
    return otpFailure(res, error, "OTP delivery failed", "Unable to send OTP right now. Please try again.");
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    const purpose = req.body?.purpose === "reset" ? "reset" : "register";
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 100) : "";
    if (!id) {
      return res.status(400).json({ success: false, message: "Please provide a valid mobile number or email and 6-digit OTP" });
    }

    await confirmOtp(id, purpose, req.body);

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
    return otpFailure(res, error, "OTP verification failed", "Unable to verify OTP right now");
  }
};

const contactLabel = (id) => (id.field === "email" ? "email address" : "mobile number");

// Signed-in customer adds the contact they did not sign up with (email or mobile), proven by OTP.
exports.sendContactOtp = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    if (!id) return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number or email address" });
    if (req.user[id.field]) {
      return res.status(400).json({ success: false, message: `Your account already has a ${contactLabel(id)}.` });
    }
    if (await User.exists(accountQuery(id))) {
      return res.status(409).json({ success: false, message: `This ${contactLabel(id)} is already linked to another account.` });
    }
    const widget = id.field === "mobile" ? widgetConfig() : null;
    if (widget) return res.status(200).json({ success: true, widget, message: "Sending OTP" });

    await deliverOtp(id, "link");
    return res.status(200).json({ success: true, message: id.field === "email" ? "OTP sent to your email" : "OTP sent to your mobile number" });
  } catch (error) {
    return otpFailure(res, error, "Contact OTP delivery failed", "Unable to send OTP right now. Please try again.");
  }
};

exports.verifyContactOtp = async (req, res) => {
  try {
    const id = parseIdentifier(req.body);
    if (!id) {
      return res.status(400).json({ success: false, message: "Please provide a valid mobile number or email and 6-digit OTP" });
    }
    await confirmOtp(id, "link", req.body);

    // Only fill the field if it is still empty; the unique index rejects it if another account took it meanwhile.
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, $or: [{ [id.field]: { $exists: false } }, { [id.field]: null }, { [id.field]: "" }] },
      { $set: { [id.field]: id.value } },
      { new: true }
    );
    if (!user) return res.status(400).json({ success: false, message: `Your account already has a ${contactLabel(id)}.` });
    return res.status(200).json({ success: true, message: `${id.field === "email" ? "Email" : "Mobile number"} added to your account`, user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: `This ${contactLabel(parseIdentifier(req.body))} is already linked to another account.` });
    }
    return otpFailure(res, error, "Contact OTP verification failed", "Unable to verify OTP right now");
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

    const profile = parseProfile(req.body);
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
