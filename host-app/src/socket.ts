import { io } from "socket.io-client";

console.log("🔌 Initializing WebSocket connection for host app...");

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("WebSocket connected in host app!");
});

socket.on("connect_error", (err) => {
  console.error("WebSocket connection error:", err);
});

export default socket;
