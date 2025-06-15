const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ Message: "Authorization header is missing or malformed" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(404).json({ Message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ Message: "Unauthorized" });
  }
};
module.exports = protectRoute;
