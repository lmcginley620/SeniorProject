import express from "express";
import cors from "cors";
import router from "./game"; // ✅ Ensure this is imported

const app = express();
const port = process.env.PORT || 3000;

// ✅ Allow requests from both `host-app` (`5173`) and `player-app` (`5174`)
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy does not allow this origin."));
      }
    },
    credentials: true,
  })
);

// Middleware for JSON parsing
app.use(express.json());

// Use game router
app.use("/api", router);

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
