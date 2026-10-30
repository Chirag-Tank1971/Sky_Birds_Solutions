const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Course = require("../models/Course");
const Payment = require("../models/Payment");
const { validateCoupon } = require("../services/couponService");
const {
  reserveCoupon,
  undoCouponReservation,
  releaseReservation,
  readOrderNotes,
  grantPurchase,
} = require("../services/purchaseService");

let razorpayFactory = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error("Payment provider is not configured");
    error.statusCode = 503;
    throw error;
  }
  return razorpayFactory();
};

// Tests replace the Razorpay client with a stub.
exports._setRazorpayFactory = (factory) => {
  razorpayFactory = factory;
};

const getCoursePrice = (course) => {
  const price = Number(course.price);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Invalid course price");
  }

  return price;
};

const findActiveCourse = async (courseId) => {
  const id = String(courseId || "").slice(0, 120);
  if (!id) return null;
  // Only live and private courses can be bought.
  const course =
    (await Course.findOne({ id })) ||
    (/^[a-f\d]{24}$/i.test(id) ? await Course.findById(id) : null);
  return course && Course.isPurchasable(course) ? course : null;
};

const hmacHex = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest("hex");

const signatureMatches = (expectedHex, receivedHex) => {
  const received = Buffer.from(String(receivedHex || ""), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

const sendError = (res, error, fallback) => {
  const status = error.statusCode === 503 || error.statusCode === 400 ? error.statusCode : 500;
  return res.status(status).json({ success: false, message: status === 500 ? fallback : error.message });
};

// Bring a payment to "captured". Payments stay "authorized" when Razorpay
// auto-capture is off or delayed; capture them here instead of refusing access.
const ensureCaptured = async (razorpay, payment) => {
  if (payment.status === "captured") return payment;
  if (payment.status !== "authorized") return payment;
  try {
    return await razorpay.payments.capture(payment.id, payment.amount, payment.currency);
  } catch (error) {
    // Another request (checkout callback or webhook) may have captured it first.
    const latest = await razorpay.payments.fetch(payment.id);
    if (latest.status === "captured") return latest;
    throw error;
  }
};

// POST /api/payment/razorpay/initiate
exports.initiateRazorpayPayment = async (req, res) => {
  try {
    const courseId = String(req.body?.courseId || "");

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const course = await findActiveCourse(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or inactive",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const alreadyPurchased = user.purchasedCourses.some(
      (item) => String(item.course) === String(course._id),
    );

    if (alreadyPurchased) {
      return res.status(409).json({
        success: false,
        message: "You have already purchased this course",
      });
    }

    // Never trust the amount sent by the frontend.
    const originalAmount = getCoursePrice(course);
    let finalAmount = originalAmount;
    let couponResult = null;
    const couponCode = typeof req.body.couponCode === "string" ? req.body.couponCode.trim() : "";

    if (couponCode && originalAmount > 0) {
      couponResult = await validateCoupon({
        code: couponCode.toUpperCase(),
        userId: user._id,
        amount: originalAmount,
      });

      if (!couponResult.valid) {
        return res.status(400).json({
          success: false,
          message: couponResult.message || "Invalid coupon",
        });
      }

      finalAmount = Number(couponResult.finalAmount);
    }

    if (!Number.isFinite(finalAmount) || finalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payable amount",
      });
    }

    const amount = Math.round(finalAmount * 100);
    if (amount > 0 && amount < 100) {
      return res.status(400).json({
        success: false,
        message: "The amount to pay must be at least ₹1",
      });
    }

    const couponId = couponResult?.coupon?._id || null;
    const paymentFields = {
      user: user._id,
      userMobile: user.mobile || "",
      course: course._id,
      courseTitle: course.title,
      amount,
      currency: "INR",
      originalAmount,
      discountAmount: Number(couponResult?.discountAmount || 0),
      finalAmount,
      couponCode: couponResult?.code || "",
      coupon: couponId,
    };

    // A retried checkout gives back the coupon use held by this customer's earlier unpaid orders.
    if (couponId) {
      const earlier = await Payment.find({ user: user._id, course: course._id, status: "created", couponState: "reserved" }).select("_id coupon");
      for (const payment of earlier) await releaseReservation(payment);
      if (!(await reserveCoupon(couponId))) {
        return res.status(400).json({ success: false, message: "This coupon usage limit has been reached" });
      }
    }

    // Free course, or a coupon that covers the full price: no payment needed.
    if (amount === 0) {
      const orderId = `free_${crypto.randomUUID()}`;
      try {
        await Payment.create({ ...paymentFields, orderId, provider: "free", couponState: couponId ? "reserved" : "none" });
        await grantPurchase({ orderId, provider: "free", via: "free" });
      } catch (error) {
        if (couponId) await undoCouponReservation(couponId);
        throw error;
      }
      return res.status(200).json({
        success: true,
        message: "Course unlocked",
        data: { free: true },
      });
    }

    let order;
    try {
      const razorpay = getRazorpay();
      order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `course_${String(course._id).slice(-10)}_${Date.now()}`,
        notes: {
          userId: String(user._id),
          courseId: String(course._id),
          couponCode: couponResult?.code || "",
          couponId: couponId ? String(couponId) : "",
          originalAmount: String(originalAmount),
          discountAmount: String(couponResult?.discountAmount || 0),
          finalAmount: String(finalAmount),
        },
      });
      await Payment.create({ ...paymentFields, orderId: order.id, provider: "razorpay", couponState: couponId ? "reserved" : "none" });
    } catch (error) {
      if (couponId) await undoCouponReservation(couponId);
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: "Sky Birds Solution",
        description: course.title,
      },
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return sendError(res, error, "Unable to create payment order");
  }
};

// POST /api/payment/razorpay/verify
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const {
      couponCode,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    const courseId = String(req.body.courseId || "");

    // 1. Validate required fields
    if (
      !courseId ||
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Required payment details are missing",
      });
    }

    // 2. Verify Razorpay payment signature
    const expectedSignature = hmacHex(process.env.RAZORPAY_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!signatureMatches(expectedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // 3. Fetch the order directly from Razorpay
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // 4. Match the order with the authenticated user and course
    if (String(order.notes?.userId || "") !== String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "Payment order does not belong to this user",
      });
    }

    const course = await findActiveCourse(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or inactive",
      });
    }

    if (String(course._id) !== String(order.notes?.courseId || "")) {
      return res.status(400).json({
        success: false,
        message: "Payment order does not match this course",
      });
    }

    // 5. Fetch the payment, capturing it if it is only authorized
    let payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.order_id === razorpay_order_id) payment = await ensureCaptured(razorpay, payment);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.amount !== order.amount ||
      payment.currency !== order.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment has not been captured successfully",
      });
    }

    // 6. Check the values recorded on the server-created order. Coupon expiry or
    // usage may change after the order was created; that does not undo a captured payment.
    const notes = readOrderNotes(order);
    if (notes.couponCode !== String(couponCode || "").trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: "Payment coupon does not match this purchase" });
    }

    // 7. Grant access (idempotent; the webhook may have done it already)
    const { alreadyPurchased } = await grantPurchase({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: order.amount,
      currency: order.currency,
      notes,
      via: "verify",
    });

    return res.status(200).json({
      success: true,
      message: alreadyPurchased
        ? "Payment verified; course access already exists"
        : "Payment verified and course access granted",
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return sendError(res, error, "Unable to verify payment");
  }
};

// POST /api/payment/razorpay/webhook
// Grants access even when the customer's browser never calls /verify
// (tab closed, network dropped). Configure it in the Razorpay dashboard for
// the events order.paid, payment.captured and payment.authorized.
exports.razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set");
    return res.status(503).json({ success: false, message: "Webhook is not configured" });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  if (!signatureMatches(hmacHex(secret, rawBody), req.get("x-razorpay-signature"))) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ success: false, message: "Invalid webhook body" });
  }

  try {
    const name = event.event;
    let payment = event.payload?.payment?.entity;
    if (!["order.paid", "payment.captured", "payment.authorized"].includes(name) || !payment?.order_id) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const razorpay = getRazorpay();
    const order = event.payload?.order?.entity || (await razorpay.orders.fetch(payment.order_id));
    // Orders not created by this site (no purchase notes) are ignored.
    if (!order?.notes?.courseId || !order?.notes?.userId) {
      return res.status(200).json({ success: true, ignored: true });
    }

    payment = await ensureCaptured(razorpay, payment);
    if (payment.status !== "captured" || payment.amount !== order.amount || payment.currency !== order.currency) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const notes = readOrderNotes(order);
    await grantPurchase({
      orderId: order.id,
      paymentId: payment.id,
      amount: order.amount,
      currency: order.currency,
      notes,
      via: "webhook",
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    // A 5xx makes Razorpay retry the webhook later.
    if (error.statusCode === 400) return res.status(200).json({ success: true, ignored: true });
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};
