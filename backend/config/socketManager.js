const userSocketMap = {}; 
let io = null;

function setIO(serverInstance) {
  io = serverInstance;
}

function getIO() {
  return io;
}

function getUserSocketMap() {
  return userSocketMap;
}

module.exports = {
  setIO,
  getIO,
  getUserSocketMap,
};
