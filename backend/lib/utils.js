const jwt = require("jsonwebtoken");

const generateToken = async (userId) => {
  const token = jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
  return token;
};

module.exports = generateToken;
