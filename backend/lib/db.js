const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose
      .connect(process.env.MONGODB_URI)
      .then(console.log("MongoDB connected successfully"));
  } catch (error) {
    console.log("Cannot connect to MongoDb", error);
  }
};

module.exports = connectDb;
