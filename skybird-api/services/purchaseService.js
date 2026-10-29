const User = require("../models/User");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const Payment = require("../models/Payment");

// Unpaid orders hold their coupon use for this long before it is released.
const RESERVATION_TTL_MS = 30 * 60 * 1000;

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

// Count one use of the coupon now, only if it is still under its limit.
// Returns false when the limit has been reached.
async function reserveCoupon(couponId) {
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      status: "active",
      $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  return Boolean(updated);
}

async function undoCouponReservation(couponId) {
  await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

// Give back the coupon use held by an unpaid order.
async function releaseReservation(payment) {
  if (!payment?.coupon) return;
  const released = await Payment.updateOne(
    { _id: payment._id, status: "created", couponState: "reserved" },
    { $set: { couponState: "released" } }
  );
  if (released.modifiedCount) await undoCouponReservation(payment.coupon);
}

// Read and check the values the server stored on the Razorpay order.
function readOrderNotes(order) {
  const notes = order?.notes || {};
  const result = {
    userId: String(notes.userId || ""),
    courseId: String(notes.courseId || ""),
    couponCode: String(notes.couponCode || "").trim().toUpperCase(),
    couponId: String(notes.couponId || ""),
    originalAmount: Number(notes.originalAmount),
    finalAmount: Number(notes.finalAmount),
    discountAmount: Number(notes.discountAmount || 0),
  };
  if (!result.userId || !result.courseId) throw badRequest("Payment order is missing purchase details");
  if (
    !Number.isFinite(result.originalAmount) ||
    !Number.isFinite(result.finalAmount) ||
    result.finalAmount <= 0 ||
    result.discountAmount < 0 ||
    Math.abs(result.originalAmount - result.discountAmount - result.finalAmount) > 0.02 ||
    order.amount !== Math.round(result.finalAmount * 100)
  ) {
    throw badRequest("Payment amount does not match this purchase");
  }
  return result;
}

// Grant course access for a completed order. Safe to call more than once for
// the same order (checkout callback and webhook can both arrive).
async function grantPurchase({ orderId, paymentId, provider = "razorpay", amount, currency = "INR", notes, via }) {
  let payment = await Payment.findOne({ orderId });
  if (!payment) {
    // Orders created before payment records existed.
    const user = await User.findById(notes.userId).select("mobile");
    payment = await Payment.findOneAndUpdate(
      { orderId },
      {
        $setOnInsert: {
          orderId,
          provider,
          user: notes.userId,
          userMobile: user?.mobile || "",
          course: notes.courseId,
          amount,
          currency,
          originalAmount: notes.originalAmount,
          discountAmount: notes.discountAmount,
          finalAmount: notes.finalAmount,
          couponCode: notes.couponCode,
          coupon: notes.couponId || null,
          couponState: "none",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const added = await User.updateOne(
    { _id: payment.user, "purchasedCourses.course": { $ne: payment.course } },
    { $push: { purchasedCourses: { course: payment.course, purchasedAt: new Date() } } }
  );
  const alreadyPurchased = added.modifiedCount === 0;

  await Payment.updateOne(
    { _id: payment._id, status: "created" },
    { $set: { status: "paid", paymentId: paymentId || "", paidAt: new Date(), grantedVia: via, lastError: "" } }
  );

  if (payment.coupon && payment.couponCode) {
    const transactionId = paymentId || orderId;
    try {
      await CouponUsage.create({
        coupon: payment.coupon,
        user: payment.user,
        code: payment.couponCode,
        course: payment.course,
        transactionId,
        originalAmount: payment.originalAmount,
        finalAmount: payment.finalAmount,
        discountAmount: payment.discountAmount,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    // A reserved use is already counted; a released or missing one is counted now.
    const fromReserved = await Payment.updateOne(
      { _id: payment._id, couponState: "reserved" },
      { $set: { couponState: "consumed" } }
    );
    if (!fromReserved.modifiedCount) {
      const fromUncounted = await Payment.updateOne(
        { _id: payment._id, couponState: { $in: ["released", "none", null] } },
        { $set: { couponState: "consumed" } }
      );
      if (fromUncounted.modifiedCount) await Coupon.updateOne({ _id: payment.coupon }, { $inc: { usedCount: 1 } });
    }
  }

  return { payment, alreadyPurchased };
}

async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_TTL_MS);
  const expired = await Payment.find({ status: "created", couponState: "reserved", createdAt: { $lt: cutoff } })
    .select("_id coupon")
    .limit(500);
  for (const payment of expired) await releaseReservation(payment);
  return expired.length;
}

function startReservationSweeper() {
  const timer = setInterval(() => {
    releaseExpiredReservations().catch((error) => console.error("Coupon reservation sweep failed:", error.message));
  }, 10 * 60 * 1000);
  timer.unref();
}

module.exports = {
  RESERVATION_TTL_MS,
  reserveCoupon,
  undoCouponReservation,
  releaseReservation,
  readOrderNotes,
  grantPurchase,
  releaseExpiredReservations,
  startReservationSweeper,
};
