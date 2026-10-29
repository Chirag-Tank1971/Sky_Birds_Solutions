// Shared setup for API tests. Uses a throwaway database on a local MongoDB
// (TEST_MONGODB_URI, default mongodb://127.0.0.1:27017) and a stub Razorpay client.
const os = require("os");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "test_key_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
process.env.VIDEO_STORAGE_PATH = fs.mkdtempSync(path.join(os.tmpdir(), "skybirds-test-videos-"));

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const baseUri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = `skybirds_test_${Date.now()}_${process.pid}`;

async function connect() {
  try {
    await mongoose.connect(`${baseUri.replace(/\/$/, "")}/${dbName}`, { serverSelectionTimeoutMS: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function disconnect() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  fs.rmSync(process.env.VIDEO_STORAGE_PATH, { recursive: true, force: true });
}

function customerToken(userId) {
  return jwt.sign({ id: String(userId), role: "customer" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
    issuer: "skybirds-api",
    audience: "skybirds-client",
  });
}

// In-memory stand-in for the Razorpay SDK methods the API uses.
function createRazorpayStub() {
  const orders = new Map();
  const payments = new Map();
  let seq = 0;
  return {
    orders: {
      create: async (data) => {
        const order = { id: `order_${++seq}`, amount: data.amount, currency: data.currency, notes: data.notes, status: "created" };
        orders.set(order.id, order);
        return order;
      },
      fetch: async (id) => {
        const order = orders.get(id);
        if (!order) throw new Error("order not found");
        return order;
      },
    },
    payments: {
      fetch: async (id) => {
        const payment = payments.get(id);
        if (!payment) throw new Error("payment not found");
        return { ...payment };
      },
      capture: async (id, amount, currency) => {
        const payment = payments.get(id);
        if (!payment || payment.status !== "authorized" || payment.amount !== amount || payment.currency !== currency) {
          throw new Error("cannot capture");
        }
        payment.status = "captured";
        return { ...payment };
      },
    },
    // Test helper: simulate the customer paying an order.
    pay(orderId, { status = "captured", amount } = {}) {
      const order = orders.get(orderId);
      const payment = { id: `pay_${++seq}`, order_id: orderId, amount: amount ?? order.amount, currency: order.currency, status };
      payments.set(payment.id, payment);
      return payment;
    },
    getOrder: (id) => orders.get(id),
  };
}

function checkoutSignature(orderId, paymentId) {
  return crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
}

function webhookSignature(body) {
  return crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
}

module.exports = { connect, disconnect, customerToken, createRazorpayStub, checkoutSignature, webhookSignature };
