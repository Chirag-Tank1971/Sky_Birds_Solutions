const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const jwt = require("jsonwebtoken");
const helpers = require("./helpers");
const request = require("supertest");
const ffmpegPath = require("ffmpeg-static");

const app = require("../app");
const Admin = require("../models/Admin");
const Course = require("../models/Course");
const { enqueueVideo, getVideoStatus, videoDir, TEMP_ROOT } = require("../services/videoService");

async function waitForVideo(videoId, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { status } = getVideoStatus(videoId);
    if (status === "ready" || status === "failed") return status;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return "timeout";
}

describe("video processing", async () => {
  const connected = await helpers.connect();
  after(() => helpers.disconnect());

  it("converts an upload in the background and writes a correct playlist (C5, B21)", async () => {
    const input = path.join(TEMP_ROOT, "sample.mp4");
    execFileSync(ffmpegPath, ["-v", "error", "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=24", "-f", "lavfi", "-i", "sine=duration=2", "-shortest", "-y", input]);

    const videoId = enqueueVideo(input);
    assert.notEqual(getVideoStatus(videoId).status, "ready");
    assert.equal(await waitForVideo(videoId), "ready");

    const master = fs.readFileSync(path.join(videoDir(videoId), "master.m3u8"), "utf8");
    assert.match(master, /RESOLUTION=320x240/);
    assert.match(master, /avc1\.4d4028/);
    assert.equal(fs.existsSync(input), false);
  });

  it("deletes a removed lesson's files when nothing else uses them (B3)", { skip: !connected && "no local MongoDB" }, async () => {
    const input = path.join(TEMP_ROOT, "sample2.mp4");
    execFileSync(ffmpegPath, ["-v", "error", "-f", "lavfi", "-i", "testsrc=duration=1:size=160x120:rate=24", "-y", input]);
    const videoId = enqueueVideo(input);
    assert.equal(await waitForVideo(videoId), "ready");

    const admin = await Admin.create({ email: "owner@example.com", password: "a-long-test-password" });
    const token = jwt.sign({ id: String(admin._id), role: "admin" }, process.env.JWT_SECRET, { issuer: "skybirds-api", audience: "skybirds-client" });
    await Course.create({ id: "c1", platform: "amazon", title: "C1", price: 1, videos: [{ id: "vid-1", title: "L1", videoId }] });

    const res = await request(app).delete("/api/admin/courses/c1/videos/vid-1").set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(fs.existsSync(videoDir(videoId)), false);
  });
});
