const dotenv = require("dotenv");

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    "FATAL: JWT_SECRET must be configured with at least 32 characters.",
  );
  process.exit(1);
}

const connectDB = require("./config/db");
const app = require("./app");
const { startVideoWorker } = require("./services/videoService");
const { startReservationSweeper } = require("./services/purchaseService");

connectDB();
startVideoWorker();
startReservationSweeper();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
