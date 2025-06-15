const express = require("express");
const {
  getUsersForSidebar,
  getMessages,
  markMessageAsSeen,
  sendMessage,
} = require("../controllers/messageController");
const protectRoute = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/user", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.put("/mark/:id", protectRoute, markMessageAsSeen);
router.post("/send/:receiverId", protectRoute, sendMessage);

module.exports = router;
