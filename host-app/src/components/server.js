const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" }, // Allow frontend connection
});

app.use(cors());
app.use(express.json());

let rooms = {}; // Store active game rooms and players

// Handle player joining a room
app.post("/join-room", (req, res) => {
  const { roomCode, playerName } = req.body;

  if (!rooms[roomCode]) {
    return res.status(400).json({ error: "Room not found." });
  }

  if (rooms[roomCode].players.includes(playerName)) {
    return res.status(400).json({ error: "Name already taken in this room." });
  }

  rooms[roomCode].players.push(playerName);

  io.to(roomCode).emit("player-joined", rooms[roomCode].players); // Notify host

  res.json({ success: true, message: "Joined successfully!" });
});

// Host creates a room
app.post("/create-room", (req, res) => {
  const { roomCode } = req.body;

  if (rooms[roomCode]) {
    return res.status(400).json({ error: "Room code already exists." });
  }

  rooms[roomCode] = { players: [] };
  res.json({ success: true, message: "Room created!" });
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join-room", ({ roomCode, playerName }) => {
    socket.join(roomCode);

    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [] };
    }

    if (!rooms[roomCode].players.includes(playerName)) {
      rooms[roomCode].players.push(playerName);
    }

    io.to(roomCode).emit("player-joined", rooms[roomCode].players);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
