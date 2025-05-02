import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import gameRouter from './game';

// Initialize Express app
const app = express();

app.use(
  cors({
    origin: true, // Allow requests from any origin
    credentials: true,
  })
);

app.use(express.json());

// Use the game router directly at the root path
app.use("/", gameRouter);

// Export the Express app as a Firebase Cloud Function
export const gameApi = functions.https.onRequest(app);