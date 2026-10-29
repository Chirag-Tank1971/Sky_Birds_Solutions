const Coupon = require("../models/Coupon");

// Checks a coupon's final values. Returns an error message, or "" when valid.
function couponProblem(coupon) {
  if (!coupon.code) return "Coupon code is required";
  if (!["percentage", "fixed"].includes(coupon.discountType)) return "Invalid discount type";
  if (!Number.isFinite(coupon.discountValue) || coupon.discountValue <= 0) return "Discount value must be greater than 0";
  if (coupon.discountType === "percentage" && coupon.discountValue > 100) return "Percentage discount cannot exceed 100%";
  if (!Number.isFinite(coupon.minPurchase) || coupon.minPurchase < 0) return "Minimum purchase cannot be negative";
  if (coupon.maxDiscount !== null && (!Number.isFinite(coupon.maxDiscount) || coupon.maxDiscount < 0)) return "Maximum discount cannot be negative";
  if (coupon.usageLimit !== null && (!Number.isInteger(coupon.usageLimit) || coupon.usageLimit < 1)) return "Usage limit must be a whole number of at least 1";
  if (!Number.isInteger(coupon.perUserLimit) || coupon.perUserLimit < 1) return "Per-user limit must be a whole number of at least 1";
  if (coupon.startsAt && coupon.expiresAt && new Date(coupon.expiresAt) <= new Date(coupon.startsAt)) return "Expiry date must be after the start date";
  return "";
}


// ==========================================
// GET ALL COUPONS
// ==========================================

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("GET COUPONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load coupons",
    });
  }
};


// ==========================================
// CREATE COUPON
// ==========================================

exports.createCoupon = async (req, res) => {
  try {
    const {
      title,
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      perUserLimit,
      startsAt,
      expiresAt,
      status,
    } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (
      !["percentage", "fixed"].includes(
        discountType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    const value = Number(discountValue);

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "percentage" &&
      value > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const normalizedCode =
      code.trim().toUpperCase();

    const existing = await Coupon.findOne({
      code: normalizedCode,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      title: String(title || "").trim(),
      code: normalizedCode,

      discountType,

      discountValue: value,

      minPurchase:
        Number(minPurchase || 0),

      maxDiscount:
        maxDiscount === "" ||
        maxDiscount === null ||
        maxDiscount === undefined
          ? null
          : Number(maxDiscount),

      usageLimit:
        usageLimit === "" ||
        usageLimit === null ||
        usageLimit === undefined
          ? null
          : Number(usageLimit),

      perUserLimit:
        Number(perUserLimit || 1),

      startsAt:
        startsAt || null,

      expiresAt:
        expiresAt || null,

      status:
        status === "paused"
          ? "paused"
          : "active",
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });

  } catch (error) {
    console.error(
      "CREATE COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  }
};


// ==========================================
// UPDATE COUPON
// ==========================================

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      perUserLimit,
      startsAt,
      expiresAt,
      status,
    } = req.body;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (
      discountType &&
      !["percentage", "fixed"].includes(
        discountType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    if (
      discountType === "percentage" &&
      Number(discountValue) > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot exceed 100%",
      });
    }

    if (title !== undefined) {
      coupon.title = String(title || "").trim();
    }

    if (code !== undefined) {
      coupon.code =
        String(code || "").trim().toUpperCase();
    }

    if (discountType !== undefined) {
      coupon.discountType =
        discountType;
    }

    if (discountValue !== undefined) {
      coupon.discountValue =
        Number(discountValue);
    }

    if (minPurchase !== undefined) {
      coupon.minPurchase =
        Number(minPurchase || 0);
    }

    if (maxDiscount !== undefined) {
      coupon.maxDiscount =
        maxDiscount === null ||
        maxDiscount === ""
          ? null
          : Number(maxDiscount);
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit =
        usageLimit === null ||
        usageLimit === ""
          ? null
          : Number(usageLimit);
    }

    if (perUserLimit !== undefined) {
      coupon.perUserLimit =
        Number(perUserLimit || 1);
    }

    if (startsAt !== undefined) {
      coupon.startsAt =
        startsAt || null;
    }

    if (expiresAt !== undefined) {
      coupon.expiresAt =
        expiresAt || null;
    }

    if (status !== undefined) {
      coupon.status =
        status === "paused"
          ? "paused"
          : "active";
    }

    const problem = couponProblem(coupon);
    if (problem) {
      return res.status(400).json({ success: false, message: problem });
    }

    if (coupon.isModified("code") && (await Coupon.exists({ code: coupon.code, _id: { $ne: coupon._id } }))) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }

    await coupon.save();

    return res.json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });

  } catch (error) {
    console.error(
      "UPDATE COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};


// ==========================================
// DELETE COUPON
// ==========================================

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon =
      await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      message: "Coupon deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};


// ==========================================
// CHANGE STATUS
// ==========================================

exports.updateCouponStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    if (
      !["active", "paused"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const coupon =
      await Coupon.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      message: `Coupon ${
        status === "active"
          ? "activated"
          : "paused"
      } successfully`,
      data: coupon,
    });

  } catch (error) {
    console.error(
      "STATUS UPDATE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon status",
    });
  }
};