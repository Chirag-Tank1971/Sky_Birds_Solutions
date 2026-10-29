const { describe, it, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const helpers = require("./helpers");
const request = require("supertest");

const app = require("../app");
const Admin = require("../models/Admin");
const Contact = require("../models/Contact");
const Course = require("../models/Course");
const Payment = require("../models/Payment");
const User = require("../models/User");

describe("admin notifications", async () => {
  const connected = await helpers.connect();
  const skip = !connected && "no local MongoDB";
  let admin;

  after(() => helpers.disconnect());

  beforeEach(async () => {
    if (!connected) return;
    await Promise.all([Admin.deleteMany({}), Contact.deleteMany({}), Course.deleteMany({}), Payment.deleteMany({}), User.deleteMany({})]);
    admin = await Admin.create({ email: "owner@example.com", password: "a-long-test-password" });
  });

  const adminAuth = () => ({
    Authorization: `Bearer ${jwt.sign({ id: String(admin._id), role: "admin" }, process.env.JWT_SECRET, { issuer: "skybirds-api", audience: "skybirds-client" })}`,
  });

  it("lists new queries, purchases and sign-ups as unread, newest first", { skip }, async () => {
    const user = await User.create({ mobile: "9200000001", name: "Asha" });
    const course = await Course.create({ id: "c1", platform: "amazon", title: "Amazon Basics", price: 999 });
    await Payment.create({ orderId: "order_1", user: user._id, userMobile: user.mobile, course: course._id, courseTitle: course.title, amount: 99900, finalAmount: 999, status: "paid", paidAt: new Date() });
    await Contact.create({ name: "Ravi", email: "ravi@example.com", subject: "Refund", message: "Hi" });

    const res = await request(app).get("/api/admin/notifications").set(adminAuth());
    assert.equal(res.status, 200);
    const types = res.body.data.items.map((item) => item.type).sort();
    assert.deepEqual(types, ["purchase", "query", "signup"]);
    assert.equal(res.body.data.unreadCount, 3);
    const purchase = res.body.data.items.find((item) => item.type === "purchase");
    assert.match(purchase.message, /Amazon Basics · ₹999/);
  });

  it("marks everything read, and counts only newer items afterwards", { skip }, async () => {
    await Contact.create({ name: "Old", email: "old@example.com", subject: "First", message: "Hi" });
    const read = await request(app).post("/api/admin/notifications/read-all").set(adminAuth());
    assert.equal(read.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await Contact.create({ name: "New", email: "new@example.com", subject: "Second", message: "Hi" });

    const res = await request(app).get("/api/admin/notifications").set(adminAuth());
    assert.equal(res.body.data.unreadCount, 1);
    assert.equal(res.body.data.items.find((item) => item.unread).message, "New: Second");
  });

  it("warns when a lesson's video files are missing on the server", { skip }, async () => {
    await Course.create({ id: "c2", platform: "amazon", title: "Ads Course", price: 1, videos: [{ id: "v1", title: "L1", videoId: crypto.randomUUID() }] });
    const res = await request(app).get("/api/admin/notifications").set(adminAuth());
    const alert = res.body.data.alerts.find((item) => item.id === "videos-missing");
    assert.ok(alert);
    assert.equal(alert.level, "error");
    assert.match(alert.message, /Ads Course/);
  });

  it("is only available to admins", { skip }, async () => {
    const customer = await User.create({ mobile: "9200000002" });
    const res = await request(app).get("/api/admin/notifications").set("Authorization", `Bearer ${helpers.customerToken(customer._id)}`);
    assert.equal(res.status, 403);
  });
});
