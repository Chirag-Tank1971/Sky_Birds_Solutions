const express = require("express");
const router = express.Router();
const { protectCustomer } = require("../middleware/auth");
const {
  getPurchasedCourses,
  getProfile,
  updateProfile,
} = require("../controllers/customerController");

router.use(protectCustomer); // all routes below need customer token

router.get("/purchased", getPurchasedCourses);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

module.exports = router;
