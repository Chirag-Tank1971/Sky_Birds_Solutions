const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const helpers = require("./helpers");
const request = require("supertest");

const app = require("../app");
const paymentController = require("../controllers/paymentController");
const { releaseExpiredReservations } = require("../services/purchaseService");
const User = require("../models/User");
const Course = require("../models/Course");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const Payment = require("../models/Payment");

describe("payments", async () => {
  const connected = await helpers.connect();
  let razorpay;
  let course;
  let buyer;
  let other;

  before(() => {
    if (!connected) return;
    razorpay = helpers.createRazorpayStub();
    paymentController._setRazorpayFactory(() => razorpay);
  });

  after(() => helpers.disconnect());

  beforeEach(async () => {
    if (!connected) return;
    await Promise.all([User.deleteMany({}), Course.deleteMany({}), Coupon.deleteMany({}), CouponUsage.deleteMany({}), Payment.deleteMany({})]);
    course = await Course.create({ id: "amazon-basics", platform: "amazon", title: "Amazon Basics", price: 999 });
    buyer = await User.create({ mobile: "9000000001", name: "Buyer" });
    other = await User.create({ mobile: "9000000002", name: "Other" });
  });

  const auth = (user) => ({ Authorization: `Bearer ${helpers.customerToken(user._id)}` });
  const owns = async (user) => {
    const fresh = await User.findById(user._id);
    return fresh.purchasedCourses.filter((p) => String(p.course) === String(course._id)).length;
  };
  const initiate = (user, body = {}) =>
    request(app).post("/api/payment/razorpay/initiate").set(auth(user)).send({ courseId: course.id, ...body });
  const verify = (user, orderId, paymentId, extra = {}) =>
    request(app).post("/api/payment/razorpay/verify").set(auth(user)).send({
      courseId: course.id,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: helpers.checkoutSignature(orderId, paymentId),
      ...extra,
    });
  const webhook = (event) => {
    const body = JSON.stringify(event);
    return request(app)
      .post("/api/payment/razorpay/webhook")
      .set("Content-Type", "application/json")
      .set("X-Razorpay-Signature", helpers.webhookSignature(body))
      .send(body);
  };

  it("creates an order and a payment record from the server price", { skip: !connected && "no local MongoDB" }, async () => {
    const res = await initiate(buyer, { amount: 1 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.amount, 99900);
    const record = await Payment.findOne({ orderId: res.body.data.orderId });
    assert.equal(record.status, "created");
    assert.equal(record.userMobile, "9000000001");
  });

  it("rejects a bad checkout signature", { skip: !connected && "no local MongoDB" }, async () => {
    const { body } = await initiate(buyer);
    const payment = razorpay.pay(body.data.orderId);
    const res = await verify(buyer, body.data.orderId, payment.id, { razorpay_signature: "00".repeat(32) });
    assert.equal(res.status, 400);
    assert.equal(await owns(buyer), 0);
  });

  it("rejects an order that belongs to another customer", { skip: !connected && "no local MongoDB" }, async () => {
    const { body } = await initiate(buyer);
    const payment = razorpay.pay(body.data.orderId);
    const res = await verify(other, body.data.orderId, payment.id);
    assert.equal(res.status, 400);
    assert.equal(await owns(other), 0);
  });

  it("grants access once, even when verify is called twice", { skip: !connected && "no local MongoDB" }, async () => {
    const { body } = await initiate(buyer);
    const payment = razorpay.pay(body.data.orderId);
    const first = await verify(buyer, body.data.orderId, payment.id);
    const second = await verify(buyer, body.data.orderId, payment.id);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(await owns(buyer), 1);
    const record = await Payment.findOne({ orderId: body.data.orderId });
    assert.equal(record.status, "paid");
    assert.equal(record.grantedVia, "verify");
  });

  it("captures an authorized payment instead of refusing access (C8)", { skip: !connected && "no local MongoDB" }, async () => {
    const { body } = await initiate(buyer);
    const payment = razorpay.pay(body.data.orderId, { status: "authorized" });
    const res = await verify(buyer, body.data.orderId, payment.id);
    assert.equal(res.status, 200);
    assert.equal(await owns(buyer), 1);
  });

  it("refuses a payment for the wrong amount", { skip: !connected && "no local MongoDB" }, async () => {
    const { body } = await initiate(buyer);
    const payment = razorpay.pay(body.data.orderId, { amount: 100 });
    const res = await verify(buyer, body.data.orderId, payment.id);
    assert.equal(res.status, 400);
    assert.equal(await owns(buyer), 0);
  });

  it("webhook grants access when the browser never calls verify (C3)", { skip: !connected && "no local MongoDB" }, async () => {
    const { body } = await initiate(buyer);
    const order = razorpay.getOrder(body.data.orderId);
    const payment = razorpay.pay(order.id);
    const event = { event: "order.paid", payload: { order: { entity: order }, payment: { entity: payment } } };
    assert.equal((await webhook(event)).status, 200);
    assert.equal((await webhook(event)).status, 200);
    assert.equal(await owns(buyer), 1);
    assert.equal((await Payment.findOne({ orderId: order.id })).grantedVia, "webhook");
  });

  it("webhook rejects a bad signature", { skip: !connected && "no local MongoDB" }, async () => {
    const res = await request(app)
      .post("/api/payment/razorpay/webhook")
      .set("Content-Type", "application/json")
      .set("X-Razorpay-Signature", "00".repeat(32))
      .send(JSON.stringify({ event: "order.paid" }));
    assert.equal(res.status, 400);
  });

  it("reserves coupon uses at checkout so the limit can't be exceeded (B2)", { skip: !connected && "no local MongoDB" }, async () => {
    await Coupon.create({ code: "FIRST1", discountType: "percentage", discountValue: 10, usageLimit: 1 });
    const first = await initiate(buyer, { couponCode: "first1" });
    assert.equal(first.status, 200);
    const second = await initiate(other, { couponCode: "FIRST1" });
    assert.equal(second.status, 400);

    // An abandoned order gives its use back after the reservation expires.
    // createdAt is immutable in Mongoose, so backdate it on the raw collection.
    await Payment.collection.updateOne({ orderId: first.body.data.orderId }, { $set: { createdAt: new Date(Date.now() - 31 * 60 * 1000) } });
    await releaseExpiredReservations();
    const third = await initiate(other, { couponCode: "FIRST1" });
    assert.equal(third.status, 200);
  });

  it("counts a coupon once when the order is paid", { skip: !connected && "no local MongoDB" }, async () => {
    await Coupon.create({ code: "SAVE10", discountType: "fixed", discountValue: 100, usageLimit: 5 });
    const { body } = await initiate(buyer, { couponCode: "SAVE10" });
    assert.equal(body.data.amount, 89900);
    const payment = razorpay.pay(body.data.orderId);
    await verify(buyer, body.data.orderId, payment.id, { couponCode: "SAVE10" });
    await verify(buyer, body.data.orderId, payment.id, { couponCode: "SAVE10" });
    const coupon = await Coupon.findOne({ code: "SAVE10" });
    assert.equal(coupon.usedCount, 1);
    assert.equal(await CouponUsage.countDocuments({ coupon: coupon._id }), 1);
  });

  it("unlocks a course for free with a 100% coupon (B12)", { skip: !connected && "no local MongoDB" }, async () => {
    await Coupon.create({ code: "FREE100", discountType: "percentage", discountValue: 100 });
    const res = await initiate(buyer, { couponCode: "FREE100" });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.free, true);
    assert.equal(await owns(buyer), 1);
    assert.equal((await Coupon.findOne({ code: "FREE100" })).usedCount, 1);
  });

  it("unlocks a ₹0 course without Razorpay (B12)", { skip: !connected && "no local MongoDB" }, async () => {
    await Course.updateOne({ _id: course._id }, { price: 0 });
    const res = await initiate(buyer);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.free, true);
    assert.equal(await owns(buyer), 1);
  });
});
