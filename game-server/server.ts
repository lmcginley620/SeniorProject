import express from 'express';
import gameRouter from './game';

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Use the game router
app.use('/api', gameRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});