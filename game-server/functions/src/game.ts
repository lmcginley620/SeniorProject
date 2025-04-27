import { Router } from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const gamesCollection = db.collection('games');

// Type Definitions
type GameStatus = 'waiting' | 'lobby' | 'in-progress' | 'results' | 'ended';

interface Player {
  id: string;
  name: string;
  score: number;
  answers: Answer[];
}

interface Answer {
  questionIndex: number;
  answer: string;
  timestamp: Date;
}

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  startedAt?: Date; // When the question was presented to players
}

interface Game {
  id: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  currentQuestionIndex: number;
  questions: Question[];
  createdAt: Date;
  statusChangedAt?: Date; // Track when game status changes for time-based calculations
}

// Mock questions for debug mode
const mockQuestions: Question[] = [
  {
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    timeLimit: 30
  },
  {
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    timeLimit: 30
  },
  {
    text: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1,
    timeLimit: 30
  }
];

// Logger utility for Firebase environment
class Logger {
  private static formatTime(): string {
    return new Date().toISOString();
  }

  private static formatMessage(type: string, message: string, data?: any): string {
    const timestamp = this.formatTime();
    const dataString = data ? ` - ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${type.toUpperCase()}: ${message}${dataString}`;
  }

  static info(message: string, data?: any): void {
    functions.logger.info(this.formatMessage('INFO', message, data));
  }

  static error(message: string, error?: any): void {
    functions.logger.error(this.formatMessage('ERROR', message, error));
  }

  static success(message: string, data?: any): void {
    functions.logger.info(this.formatMessage('SUCCESS', message, data));
  }

  static warn(message: string, data?: any): void {
    functions.logger.warn(this.formatMessage('WARN', message, data));
  }
}

class GameManager {
  private anthropic: Anthropic | null;
  private debugMode: boolean;

  constructor(apiKey: string, debug: boolean = false) {
    this.debugMode = debug;

    // Initialize Anthropic client for production mode
    if (!debug) {
      const actualApiKey = apiKey || functions.config().anthropic?.api_key;
      if (!actualApiKey) {
        Logger.warn('No Anthropic API key found in environment variables or Firebase config');
      }
      this.anthropic = new Anthropic({ apiKey: actualApiKey });
    } else {
      this.anthropic = null;
    }

    Logger.info(`Game Manager initialized in ${debug ? 'debug' : 'production'} mode`);
  }

  async createGame(hostId: string, topics: string[]): Promise<Game> {
    Logger.info('Creating new game', { hostId, topics, debugMode: this.debugMode });
    const gameId = this.generateGameCode();

    try {
      // Create a new game with empty questions initially
      const game: Game = {
        id: gameId,
        hostId,
        status: 'waiting',
        players: [],
        currentQuestionIndex: 0,
        questions: [],
        createdAt: new Date(),
        statusChangedAt: new Date()
      };

      // Store the game in Firestore
      await gamesCollection.doc(gameId).set({
        ...game,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        statusChangedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      Logger.success('Game created successfully', { gameId, debugMode: this.debugMode });
      return game;
    } catch (error) {
      Logger.error('Failed to create game', error);
      throw error;
    }
  }

  private generateGameCode(): string {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    Logger.info('Generated game code', { code });
    return code;
  }

  async generateQuestions(topics: string[]): Promise<Question[]> {
    if (this.debugMode) {
      Logger.info('Debug mode: Using mock questions');
      return mockQuestions;
    }

    Logger.info('Generating questions for topics', { topics });

    try {
      if (!this.anthropic) throw new Error('Anthropic client is not initialized.');

      const prompt = `Generate 3 multiple-choice trivia questions on the following topics: ${topics.join(', ')}.
      Each question should have 4 answer choices, and the correct answer should be marked with its index (0-3).
      Format the response as a JSON array of objects with "text", "options", "correctAnswer", and "timeLimit".
      The response should just be the raw JSON, do not write it in a code block.`;

      const response = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      });

      const responseContent = response.content[0];
      if (!responseContent) throw new Error('Invalid response from Claude');

      let content = "";
      switch (responseContent.type) {
        case "text":
          content = responseContent.text;
          Logger.info("Response from Claude:", content);
          break;
        default:
          throw new Error('Invalid response type from Claude');
      }
      const parsedQuestions: Question[] = JSON.parse(content);

      Logger.success('Questions generated successfully');
      return parsedQuestions;
    } catch (error) {
      Logger.error('Failed to generate questions', error);
      throw error;
    }
  }

  async getGame(gameId: string): Promise<Game | null> {
    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        return null;
      }
      return gameDoc.data() as Game;
    } catch (error) {
      Logger.error('Failed to get game', error);
      return null;
    }
  }

  async listGames(): Promise<string[]> {
    try {
      const gamesSnapshot = await gamesCollection.get();
      return gamesSnapshot.docs.map(doc => doc.id);
    } catch (error) {
      Logger.error('Failed to list games', error);
      return [];
    }
  }

  async joinGame(gameId: string, playerName: string): Promise<Player | null> {
    Logger.info('Player attempting to join game', { gameId, playerName });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        Logger.warn('Join game failed - game not found', { gameId });
        return null;
      }

      const game = gameDoc.data() as Game;
      if (game.status !== 'lobby') {
        Logger.warn('Join game failed - invalid game status', { gameId, status: game.status });
        return null;
      }

      const player: Player = {
        id: uuidv4(),
        name: playerName,
        score: 0,
        answers: []
      };

      // Update the players array in Firestore
      await gamesCollection.doc(gameId).update({
        players: admin.firestore.FieldValue.arrayUnion(player)
      });

      Logger.success('Player joined game successfully', { gameId, playerId: player.id });
      return player;
    } catch (error) {
      Logger.error('Failed to join game', error);
      return null;
    }
  }

  async createLobby(gameId: string, hostId: string): Promise<boolean> {
    Logger.info('Attempting to create lobby', { gameId, hostId });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        Logger.warn('Create lobby failed - game not found', { gameId });
        return false;
      }

      const game = gameDoc.data() as Game;
      if (game.hostId !== hostId || game.status !== "waiting") {
        Logger.warn('Create lobby failed - invalid game state', {
          correctHost: game.hostId === hostId,
          status: game.status
        });
        return false;
      }

      const now = new Date();

      await gamesCollection.doc(gameId).update({
        status: "lobby",
        statusChangedAt: now
      });

      Logger.success("Lobby created - Players can now join", { gameId });
      return true;
    } catch (error) {
      Logger.error('Failed to create lobby', error);
      return false;
    }
  }

  async startTrivia(gameId: string, hostId: string): Promise<boolean> {
    Logger.info('Attempting to start trivia', { gameId, hostId });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        Logger.warn('Start trivia failed - game not found', { gameId });
        return false;
      }

      const game = gameDoc.data() as Game;
      if (game.hostId !== hostId || game.status !== "lobby") {
        Logger.warn('Start trivia failed - invalid game state', {
          correctHost: game.hostId === hostId,
          status: game.status
        });
        return false;
      }

      const now = new Date();

      // If no questions, use mock questions in production too
      if (game.questions.length === 0) {
        Logger.info("No questions found, assigning mock questions to game", { gameId });

        // Set startedAt for the first question
        const updatedQuestions = [...mockQuestions];
        updatedQuestions[0] = {
          ...updatedQuestions[0],
          startedAt: now
        };

        await gamesCollection.doc(gameId).update({
          questions: updatedQuestions,
          status: "in-progress",
          statusChangedAt: now
        });
      } else {
        // Set startedAt for the first question
        const updatedQuestions = [...game.questions];
        updatedQuestions[0] = {
          ...updatedQuestions[0],
          startedAt: now
        };

        await gamesCollection.doc(gameId).update({
          questions: updatedQuestions,
          status: "in-progress",
          statusChangedAt: now
        });
      }

      Logger.success("Trivia officially started", { gameId });
      return true;
    } catch (error) {
      Logger.error('Failed to start trivia', error);
      return false;
    }
  }

  async submitAnswer(gameId: string, playerId: string, answer: string): Promise<boolean> {
    Logger.info('Processing answer submission', { gameId, playerId });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        return false;
      }

      const game = gameDoc.data() as Game;
      if (game.status !== 'in-progress') {
        Logger.warn('Answer submission failed - invalid game state', { gameId, status: game.status });
        return false;
      }

      const playerIndex = game.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        Logger.warn('Answer submission failed - player not found', { gameId, playerId });
        return false;
      }

      const player = game.players[playerIndex];
      const currentQuestion = game.questions[game.currentQuestionIndex];

      if (player.answers.some(a => a.questionIndex === game.currentQuestionIndex)) {
        Logger.warn('Duplicate answer detected', { gameId, playerId });
        return false;
      }

      // Get current timestamp for answer
      const now = new Date();

      const newAnswer = {
        questionIndex: game.currentQuestionIndex,
        answer,
        timestamp: now
      };

      // Calculate score based on time taken to answer
      let scoreForQuestion = 0;
      const isCorrect = currentQuestion.options[currentQuestion.correctAnswer] === answer;

      if (isCorrect) {
        // Base score for correct answer
        const maxScore = 100;
        const timeLimit = currentQuestion.timeLimit || 30; // Default to 30 seconds if not specified

        // Calculate elapsed time since question started
        let elapsedSeconds = 0;
        if (currentQuestion.startedAt) {
          const questionStartTime =
            typeof currentQuestion.startedAt === 'string' || currentQuestion.startedAt instanceof Date
              ? new Date(currentQuestion.startedAt)
              : new Date((currentQuestion.startedAt as any).seconds * 1000);

          elapsedSeconds = Math.max(0, (now.getTime() - questionStartTime.getTime()) / 1000);
        }

        // Calculate score based on time taken (linear decay)
        // At 0 seconds: 100% of maxScore
        // At timeLimit seconds: 50% of maxScore
        scoreForQuestion = Math.max(
          Math.round(maxScore * (1 - (elapsedSeconds / (timeLimit * 2)))),
          Math.round(maxScore * 0.5) // Minimum 50% of max score for correct answers
        );

        Logger.info('Score calculated for answer', {
          isCorrect,
          elapsedSeconds,
          scoreForQuestion,
          maxScore
        });
      }

      // Update player's answers and score
      const newScore = player.score + scoreForQuestion;

      // Create updated players array
      const updatedPlayers = [...game.players];
      updatedPlayers[playerIndex] = {
        ...player,
        score: newScore,
        answers: [...player.answers, newAnswer]
      };

      await gamesCollection.doc(gameId).update({
        players: updatedPlayers
      });

      // Check if all players have answered
      const allAnswered = updatedPlayers.every(p =>
        p.answers.some(a => a.questionIndex === game.currentQuestionIndex)
      );

      if (allAnswered) {
        Logger.success('All players have submitted answers, moving to results phase', { gameId });

        const now = new Date();

        await gamesCollection.doc(gameId).update({
          status: 'results',
          statusChangedAt: now
        });

        // Replace if necessary
        setTimeout(() => {
          this.nextQuestion(gameId);
        }, 5000);
      }

      return true;
    } catch (error) {
      Logger.error('Failed to submit answer', error);
      return false;
    }
  }

  async nextQuestion(gameId: string): Promise<Question | null> {
    Logger.info('Moving to next question', { gameId });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        Logger.warn('Next question failed - game not found', { gameId });
        return null;
      }

      const game = gameDoc.data() as Game;
      if (game.status !== 'results') {
        Logger.warn('Next question failed - invalid game state', {
          status: game.status
        });
        return null;
      }

      const nextIndex = game.currentQuestionIndex + 1;
      const now = new Date();

      if (nextIndex >= game.questions.length) {
        await gamesCollection.doc(gameId).update({
          status: 'ended',
          statusChangedAt: now
        });
        Logger.info('Game ended - all questions completed', { gameId });
        return null;
      } else {
        // Update the next question with a startedAt timestamp
        const updatedQuestions = [...game.questions];
        updatedQuestions[nextIndex] = {
          ...updatedQuestions[nextIndex],
          startedAt: now
        };

        await gamesCollection.doc(gameId).update({
          currentQuestionIndex: nextIndex,
          questions: updatedQuestions,
          status: 'in-progress',
          statusChangedAt: now
        });

        Logger.success('Advanced to next question', {
          gameId,
          questionIndex: nextIndex,
          questionsRemaining: game.questions.length - nextIndex
        });

        return game.questions[nextIndex];
      }
    } catch (error) {
      Logger.error('Failed to advance to next question', error);
      return null;
    }
  }

  async getLeaderboard(gameId: string): Promise<Player[]> {
    Logger.info('Fetching leaderboard', { gameId });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        Logger.warn('Leaderboard request failed - game not found', { gameId });
        return [];
      }

      const game = gameDoc.data() as Game;
      const leaderboard = [...game.players].sort((a, b) => b.score - a.score);

      Logger.info('Leaderboard generated', {
        gameId,
        playerCount: leaderboard.length,
        topScore: leaderboard[0]?.score
      });

      return leaderboard;
    } catch (error) {
      Logger.error('Failed to get leaderboard', error);
      return [];
    }
  }

  async getCurrentQuestion(gameId: string): Promise<Question | null> {
    Logger.info('Fetching current question', { gameId });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        Logger.warn('Question fetch failed - game not found', { gameId });
        return null;
      }

      const game = gameDoc.data() as Game;
      if (game.status !== 'in-progress') {
        Logger.warn('Question fetch failed - invalid game state', { gameId, status: game.status });
        return null;
      }

      Logger.info('Current question retrieved', {
        gameId,
        questionIndex: game.currentQuestionIndex
      });

      return game.questions[game.currentQuestionIndex];
    } catch (error) {
      Logger.error('Failed to get current question', error);
      return null;
    }
  }

  async endGame(gameId: string, hostId: string): Promise<boolean> {
    Logger.info('Attempting to end game', { gameId, hostId });

    try {
      const gameDoc = await gamesCollection.doc(gameId).get();
      if (!gameDoc.exists) {
        Logger.warn('End game failed - game not found', { gameId });
        return false;
      }

      const game = gameDoc.data() as Game;
      if (game.hostId !== hostId) {
        Logger.warn('End game failed - invalid host', {
          correctHost: game.hostId === hostId
        });
        return false;
      }

      const now = new Date();

      await gamesCollection.doc(gameId).update({
        status: 'ended',
        statusChangedAt: now
      });

      Logger.success('Game ended successfully', {
        gameId,
        finalScores: game.players.map(p => ({ name: p.name, score: p.score }))
      });

      return true;
    } catch (error) {
      Logger.error('Failed to end game', error);
      return false;
    }
  }
}

// Router setup
const router = Router();
const isDebugMode = process.env.DEBUG_MODE === 'true' || functions.config().debug?.mode === 'true';
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || functions.config().anthropic?.api_key;
const gameManager = new GameManager(anthropicApiKey || '', isDebugMode);

// API endpoints
router.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

router.post('/games', async (req, res) => {
  try {
    Logger.info('POST /games request received', { body: req.body });
    const { hostId, topics } = req.body;
    const game = await gameManager.createGame(hostId, topics);
    Logger.success('POST /games request completed');
    res.json(game);
  } catch (error) {
    Logger.error('POST /games request failed', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

router.post('/games/:id/join', async (req, res) => {
  Logger.info('POST /games/:id/join request received', {
    gameId: req.params.id,
    body: req.body
  });

  try {
    const { playerName } = req.body;
    const player = await gameManager.joinGame(req.params.id, playerName);
    if (!player) {
      Logger.warn('Join game request failed');
      res.status(400).json({ error: 'Unable to join game' });
      return;
    }

    Logger.success('Join game request completed');
    res.json(player);
  } catch (error) {
    Logger.error('Join game request failed', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

router.get('/games/:id/players', async (req, res) => {
  const gameId = req.params.id;

  Logger.info('GET /games/:id/players request received', { gameId });

  try {
    const gameIds = await gameManager.listGames();
    console.log("Active Games in Firestore: ", gameIds);

    const game = await gameManager.getGame(gameId);
    if (!game) {
      Logger.warn('Get players request failed - game not found', { gameId });
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    Logger.success('Get players request completed', { players: game.players });
    res.json(game.players);
  } catch (error) {
    Logger.error('Get players request failed', error);
    res.status(500).json({ error: 'Failed to get players' });
  }
});

router.post('/games/:id/lobby', async (req, res) => {
  Logger.info('POST /games/:id/lobby request received', {
    gameId: req.params.id,
    body: req.body
  });

  try {
    const { hostId, topics } = req.body;
    const game = await gameManager.getGame(req.params.id);

    if (!game || game.hostId !== hostId || game.status !== "waiting") {
      Logger.warn('Create lobby request failed');
      res.status(400).json({ error: 'Unable to create lobby' });
      return;
    }

    const questions = await gameManager.generateQuestions(topics);

    // Update game with questions
    await gamesCollection.doc(req.params.id).update({
      questions: questions,
      status: "lobby",
      statusChangedAt: new Date()
    });

    Logger.success("Lobby created with generated questions", { gameId: req.params.id });
    res.json({ status: "lobby", questions });
  } catch (error) {
    Logger.error("Failed to generate questions", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

router.post('/games/:id/start-trivia', async (req, res) => {
  Logger.info('POST /games/:id/start-trivia request received', {
    gameId: req.params.id,
    body: req.body
  });

  try {
    const { hostId } = req.body;
    const success = await gameManager.startTrivia(req.params.id, hostId);

    if (!success) {
      Logger.warn('Start trivia request failed');
      res.status(400).json({ error: 'Unable to start trivia' });
      return;
    }

    const game = await gameManager.getGame(req.params.id);
    if (!game) {
      Logger.warn('Start trivia request failed - game not found');
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    Logger.success('Trivia started successfully');
    const question = game.questions[game.currentQuestionIndex];
    res.json({ status: "in-progress", question });
  } catch (error) {
    Logger.error('Start trivia request failed', error);
    res.status(500).json({ error: 'Failed to start trivia' });
  }
});

router.get('/games/:id/questions', async (req, res) => {
  Logger.info('GET /games/:id/questions request received', { gameId: req.params.id });

  try {
    const question = await gameManager.getCurrentQuestion(req.params.id);
    if (!question) {
      Logger.warn('Get question request failed');
      res.status(400).json({ error: 'No current question' });
      return;
    }

    Logger.success('Get question request completed');
    res.json(question);
  } catch (error) {
    Logger.error('Get question request failed', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
});

router.get('/games/:id/results', async (req, res) => {
  const gameId = req.params.id;
  Logger.info('GET /games/:id/results request received', { gameId });

  try {
    const game = await gameManager.getGame(gameId);

    if (!game || game.status !== 'results') {
      Logger.warn('Get results request failed - game is not in results phase', { gameId, status: game?.status });
      res.status(400).json({ error: 'Game is not in results phase' });
      return;
    }

    const currentQuestion = game.questions[game.currentQuestionIndex];

    const answerCounts: Record<string, number> = {};
    currentQuestion.options.forEach((option) => {
      answerCounts[option] = 0;
    });

    game.players.forEach((player) => {
      const answer = player.answers.find(
        (a) => a.questionIndex === game.currentQuestionIndex
      )?.answer;
      if (answer && answerCounts.hasOwnProperty(answer)) {
        answerCounts[answer] += 1;
      }
    });

    Logger.success('Results retrieved successfully', { gameId, results: answerCounts });
    res.json({ question: currentQuestion.text, results: answerCounts });
  } catch (error) {
    Logger.error('Get results request failed', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

router.get("/games/:id/status", async (req, res) => {
  const gameId = req.params.id;
  Logger.info("GET /games/:id/status request received", { gameId });

  try {
    const game = await gameManager.getGame(gameId);
    if (!game) {
      Logger.warn("Game status request failed - game not found", { gameId });
      res.status(404).json({ error: "Game not found" });
      return;
    }

    Logger.success("Game status request completed", { gameId, status: game.status });
    res.json({ status: game.status });
  } catch (error) {
    Logger.error('Get status request failed', error);
    res.status(500).json({ error: 'Failed to get game status' });
  }
});

router.post('/games/:id/answer', async (req, res) => {
  Logger.info('POST /games/:id/answer request received', {
    gameId: req.params.id,
    body: req.body
  });

  try {
    const { playerId, answer } = req.body;
    const success = await gameManager.submitAnswer(req.params.id, playerId, answer);

    if (!success) {
      Logger.warn('Submit answer request failed');
      res.status(400).json({ error: 'Unable to submit answer' });
      return;
    }

    Logger.success('Submit answer request completed');
    res.json({ status: 'answer recorded' });
  } catch (error) {
    Logger.error('Submit answer request failed', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

router.post('/games/:id/next-question', async (req, res) => {
  Logger.info('POST /games/:id/next-question request received', { gameId: req.params.id });

  try {
    const gameId = req.params.id;
    const game = await gameManager.getGame(gameId);

    if (!game) {
      Logger.warn('Next question request failed - game not found', { gameId });
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    if (game.status !== 'results') {
      Logger.warn('Next question request failed - game is not in results phase', { gameId, status: game.status });
      res.status(400).json({ error: 'Game is not in the results phase' });
      return;
    }

    //const nextQuestion = await gameManager.nextQuestion(gameId);
    const updatedGame = await gameManager.getGame(gameId);

    if (!updatedGame || updatedGame.status === 'ended') {
      Logger.success('Game ended, no more questions remaining', { gameId });
      res.json({ status: 'ended' });
      return;
    }

    Logger.success('Moved to next question', { gameId, questionIndex: updatedGame.currentQuestionIndex });
    res.json({
      status: 'in-progress',
      question: updatedGame.questions[updatedGame.currentQuestionIndex]
    });
  } catch (error) {
    Logger.error('Next question request failed', error);
    res.status(500).json({ error: 'Failed to move to next question' });
  }
});

export default router;