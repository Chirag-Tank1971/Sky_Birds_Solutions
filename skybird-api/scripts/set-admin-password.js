// Set a new password for an admin account in the database from MONGODB_URI.
// Usage: npm run set-admin-password -- admin@example.com
// The password is typed into the terminal (hidden) and is never printed or logged.
const readline = require("readline");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const Admin = require("../models/Admin");

const MIN_LENGTH = 12;

// One reader for every question. Lines that arrive before their question is
// asked (pasted or piped input) are queued instead of lost.
let rl;
let muted = false;
const pendingLines = [];
const waiting = [];

function askHidden(question) {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
    // Never echo what is typed while a password is being entered.
    rl._writeToOutput = (text) => {
      if (!muted) rl.output.write(text);
    };
    rl.on("line", (line) => (waiting.length ? waiting.shift()(line) : pendingLines.push(line)));
  }
  process.stdout.write(question);
  muted = true;
  return new Promise((resolve) => {
    const answer = (line) => {
      muted = false;
      process.stdout.write("\n");
      resolve(line);
    };
    if (pendingLines.length) answer(pendingLines.shift());
    else waiting.push(answer);
  });
}

async function main() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email) throw new Error("Give the admin email: npm run set-admin-password -- admin@example.com");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in .env");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const admin = await Admin.findOne({ email });
  if (!admin) throw new Error(`No admin account found for ${email}`);

  const password = await askHidden(`New password for ${email} (at least ${MIN_LENGTH} characters): `);
  if (password.length < MIN_LENGTH) throw new Error(`Password must be at least ${MIN_LENGTH} characters. Nothing was changed.`);
  if (password === "admin123") throw new Error("That password is blocked. Nothing was changed.");
  const confirm = await askHidden("Type it again: ");
  if (confirm !== password) throw new Error("The passwords don't match. Nothing was changed.");

  // The Admin model hashes the password with bcrypt when it is saved.
  admin.password = password;
  await admin.save();
  console.log(`Password updated for ${email}. You can now log in to the admin panel.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    if (rl) rl.close();
    return mongoose.disconnect();
  });
