const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

// True when the token was issued before the user's last password change.
// JWT iat has one-second precision, so compare in whole seconds.
function issuedBeforePasswordChange(user, decoded) {
  if (!user?.passwordChangedAt || !decoded?.iat) return false;
  return decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000);
}
exports.issuedBeforePasswordChange = issuedBeforePasswordChange;

// Protect customer routes
exports.protectCustomer = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "skybirds-api", audience: "skybirds-client" });

    if (decoded.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Customers only.",
      });
    }

    const user = await User.findById(decoded.id).select("+passwordChangedAt");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (issuedBeforePasswordChange(user, decoded)) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Contact support.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

// Protect admin routes
exports.protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "skybirds-api", audience: "skybirds-client" });

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};
