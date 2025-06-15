const Message = require("../models/Message");
const User = require("../models/User");
const cloudinary = require("../lib/cloudinary");
const { getIO, getUserSocketMap } = require("../config/socketManager");

//get all users except logged in user
const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    // console.log("Logged-in user ID:", userId); // Debug log

    const filterUsers = await User.find({
      _id: { $ne: userId },
    }).select("-password");

    // console.log("Filtered users:", filterUsers); // Debug log

    // Count unseen messages
    const unseenMessages = {};
    const promises = filterUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    await Promise.all(promises);
    res.status(200).json({ Success: true, users: filterUsers, unseenMessages });
  } catch (error) {
    console.log("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ Success: false, Message: error.message });
  }
};
// Get all messages for selected User
const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    //mark messages as read
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );
    res.status(200).json({ Success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ Success: false, Message: error.message });
  }
};

//api to mark messages as seen using message id
const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.status(200).json({ Success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ Success: false, Message: error.message });
  }
};

//send message to selected user
const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.receiverId;
    const senderId = req.user._id;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image,
    });

    // Emit message via Socket.IO
    const io = getIO();
    const userSocketMap = getUserSocketMap();
    const receiverSocketId = userSocketMap[receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(200).json({ success: true, newMessage });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsersForSidebar,
  getMessages,
  markMessageAsSeen,
  sendMessage,
};
