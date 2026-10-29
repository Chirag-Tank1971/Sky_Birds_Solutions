const { describe, it, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const helpers = require("./helpers");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const Course = require("../models/Course");
const { videoDir, outputResolution } = require("../services/videoService");

describe("video playback access", async () => {
  const connected = await helpers.connect();
  const skip = !connected && "no local MongoDB";
  const videoId = crypto.randomUUID();
  let owner;
  let stranger;

  after(() => helpers.disconnect());

  beforeEach(async () => {
    if (!connected) return;
    await Promise.all([User.deleteMany({}), Course.deleteMany({})]);
    const course = await Course.create({
      id: "secure-course",
      platform: "amazon",
      title: "Secure Course",
      price: 499,
      videos: [{ id: "vid-1", title: "Lesson 1", videoId }],
    });
    owner = await User.create({ mobile: "9100000001", purchasedCourses: [{ course: course._id }] });
    stranger = await User.create({ mobile: "9100000002" });
    fs.mkdirSync(videoDir(videoId), { recursive: true });
    fs.writeFileSync(path.join(videoDir(videoId), "master.m3u8"), "#EXTM3U\nmedia.m3u8\n");
  });

  const authorize = (user) =>
    request(app)
      .post("/api/courses/secure-course/videos/vid-1/playback")
      .set("Authorization", `Bearer ${helpers.customerToken(user._id)}`);

  it("refuses a customer who does not own the course", { skip }, async () => {
    assert.equal((await authorize(stranger)).status, 403);
  });

  it("issues a playback token to the owner, which opens the playlist", { skip }, async () => {
    const res = await authorize(owner);
    assert.equal(res.status, 200);
    const playlist = await request(app).get(`${res.body.masterUrl}?token=${res.body.token}`);
    assert.equal(playlist.status, 200);
    assert.match(playlist.text, /media\.m3u8\?token=/);
  });

  it("rejects the playlist without a playback token", { skip }, async () => {
    assert.equal((await request(app).get(`/api/videos/${videoId}/master.m3u8`)).status, 401);
  });

  it("does not accept the login token in the URL (B16)", { skip }, async () => {
    const res = await request(app).post(`/api/courses/secure-course/videos/vid-1/playback?token=${helpers.customerToken(owner._id)}`);
    assert.equal(res.status, 401);
  });

  it("signs out sessions issued before a password reset (B14)", { skip }, async () => {
    const token = helpers.customerToken(owner._id);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await User.updateOne({ _id: owner._id }, { $set: { passwordChangedAt: new Date() } });
    const res = await request(app).get("/api/customer/profile").set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 401);
  });

  it("computes the encoded resolution (B21)", () => {
    assert.equal(outputResolution(1920, 1080), "1280x720");
    assert.equal(outputResolution(854, 480), "854x480");
    assert.equal(outputResolution(0, 0), null);
  });
});
