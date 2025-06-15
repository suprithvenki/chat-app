const {
  signup,
  login,
  updateProfile,
  checkAuth,
} = require("../controllers/userController");
const express = require("express");
const protectRoute = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);

module.exports = router;
