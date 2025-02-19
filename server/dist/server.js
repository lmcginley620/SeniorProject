"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"], // Adjust ports if needed
        methods: ["GET", "POST"]
    }
});
const rooms = {}; // Store players in rooms
io.on("connection", (socket) => {
    console.log(`🔗 New connection: ${socket.id}`);
    socket.on("joinRoom", ({ roomCode, playerName }) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = [];
        }
        rooms[roomCode].push(playerName);
        socket.join(roomCode);
        console.log(`👤 ${playerName} joined room: ${roomCode}`);
        // Send updated player list to the host
        io.to(roomCode).emit("roomUpdate", rooms[roomCode]);
    });
    socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});
server.listen(5000, () => {
    console.log("✅ Server running on http://localhost:5000");
});
