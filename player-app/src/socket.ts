import { io } from "socket.io-client";

console.log("🔌 Initializing WebSocket connection...");

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("WebSocket connected to server!");
});

socket.on("connect_error", (err) => {
  console.error("WebSocket connection error:", err);
});

export default socket;
