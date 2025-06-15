const express = require("express");
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const connectDb = require("./lib/db");
const userRouter = require("./routes/userRoutes");
const messageRouter = require("./routes/messageRoutes");
const { setIO, getUserSocketMap } = require("./config/socketManager");

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "../client/dist")));

// CORS for frontend
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend
    credentials: true,
  })
);

// Middleware to handle large payloads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});
setIO(io);

const userSocketMap = getUserSocketMap();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Routes
connectDb();
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Start server
const port = process.env.PORT || 5001;
server.listen(port, () => console.log(`Server running on port ${port}`));
