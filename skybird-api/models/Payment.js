const mongoose = require("mongoose");

// One record per checkout order. Kept even if the customer is later deleted,
// so refunds and disputes can still be traced.
const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    paymentId: { type: String, trim: true, default: "" },
    provider: { type: String, enum: ["razorpay", "free"], default: "razorpay" },
    status: { type: String, enum: ["created", "paid"], default: "created", index: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userMobile: { type: String, default: "" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    courseTitle: { type: String, default: "" },

    // Amount charged by the provider, in paise.
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    // Rupee amounts recorded when the order was created.
    originalAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, default: 0, min: 0 },

    couponCode: { type: String, default: "" },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    // reserved: counted in Coupon.usedCount while unpaid; released: unpaid order expired;
    // consumed: payment completed and the use is counted for good.
    couponState: { type: String, enum: ["none", "reserved", "released", "consumed"], default: "none" },

    grantedVia: { type: String, enum: ["verify", "webhook", "free", ""], default: "" },
    paidAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, couponState: 1, createdAt: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
