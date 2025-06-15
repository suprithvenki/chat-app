const User = require("../models/User");
const generateToken = require("../lib/utils");
const bcrypt = require("bcryptjs");
const cloudinary = require("../lib/cloudinary");

const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(500).json({ Message: "Some fields are missing" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(500).json({ Message: "User exists" });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = await generateToken(newUser._id);

    res.status(200).json({
      success: true,
      Message: "Registered successfully",
      userData: newUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ Message: "Failed to create an account" });
    console.log("Failed to create account", error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(404).json({ Message: "You have not registered" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

    if (!isPasswordCorrect) {
      return res.status(500).json({ Message: "Incorrect password" });
    }
    const token = await generateToken(userData._id);
    res
      .status(200)
      .json({ success: true, Message: "Login successfull", userData, token });
  } catch (error) {
    console.log("Error in logging user", error);
    res.status(500).json("Error during sigin ");
  }
};

//User authentication check
const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

//controller to update user profile details
const updateProfile = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!bio && !fullName && !profilePic) {
      return res.status(400).json({ message: "No fields to update" });
    }

    let updateData = { bio, fullName };

    if (profilePic) {
      try {
        const uploadOptions = {
          resource_type: "auto",
          timeout: 60000,
          chunk_size: 20000000,
          quality: "auto:good",
        };

        // If profilePic is base64, add the prefix
        const uploadResponse = await cloudinary.uploader.upload(
          profilePic.startsWith("data:")
            ? profilePic
            : `data:image/jpeg;base64,${profilePic}`,
          uploadOptions
        );

        updateData.profilePic = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload profile picture",
          error: uploadError.message,
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};
module.exports = { signup, login, checkAuth, updateProfile };
