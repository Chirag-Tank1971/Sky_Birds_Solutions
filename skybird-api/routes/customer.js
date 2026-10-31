const express = require("express");
const router = express.Router();
const { protectCustomer } = require("../middleware/auth");
const {
  getPurchasedCourses,
  getProfile,
  updateProfile,
  getTransactions,
} = require("../controllers/customerController");
const { sendContactOtp, verifyContactOtp, changePassword } = require("../controllers/authController");

router.use(protectCustomer); // all routes below need customer token

router.get("/purchased", getPurchasedCourses);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/transactions", getTransactions);
router.post("/password", changePassword);
router.post("/contact/send-otp", sendContactOtp);
router.post("/contact/verify-otp", verifyContactOtp);

module.exports = router;
