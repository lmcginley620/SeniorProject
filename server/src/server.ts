import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "http://localhost:5175"], 
    methods: ["GET", "POST"],
    credentials: true,
  }
});


const rooms: Record<string, string[]> = {};

io.on("connection", (socket) => {
  console.log(`New WebSocket connection: ${socket.id}`);

  socket.on("joinRoom", ({ roomCode, playerName }) => {
    console.log(`Received joinRoom event: ${playerName} -> ${roomCode}`);

    if (!rooms[roomCode]) {
      rooms[roomCode] = [];
    }

    rooms[roomCode].push(playerName);
    socket.join(roomCode);

    console.log(`${playerName} joined room: ${roomCode}`);
    console.log(`Sending roomUpdate event to room ${roomCode}:`, rooms[roomCode]);

    io.to(roomCode).emit("roomUpdate", rooms[roomCode]);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
