const mongoose = require("mongoose");
const OtpChallenge = require("../models/OtpChallenge");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // OTP records live for minutes, so it's safe to drop indexes left by older API versions
    // (e.g. a unique `mobile` index that blocks email OTPs) and match the current schema.
    OtpChallenge.syncIndexes().catch((err) => console.error("OTP index sync failed:", err.message));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
