import express from 'express';
import { Router } from 'express';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

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
}

interface Game {
  id: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  currentQuestionIndex: number;
  questions: Question[];
  createdAt: Date;
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

// Logger utility
class Logger {
  private static formatTime(): string {
    return new Date().toISOString();
  }

  private static formatMessage(type: string, message: string, data?: any): string {
    const timestamp = this.formatTime();
    const dataString = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] ${type.toUpperCase()}: ${message}${dataString}`;
  }

  static info(message: string, data?: any): void {
    console.log('\x1b[36m%s\x1b[0m', this.formatMessage('INFO', message, data));
  }

  static error(message: string, error?: any): void {
    console.error('\x1b[31m%s\x1b[0m', this.formatMessage('ERROR', message, error));
  }

  static success(message: string, data?: any): void {
    console.log('\x1b[32m%s\x1b[0m', this.formatMessage('SUCCESS', message, data));
  }

  static warn(message: string, data?: any): void {
    console.log('\x1b[33m%s\x1b[0m', this.formatMessage('WARN', message, data));
  }
}

class GameManager {
  private games: Map<string, Game>;
  private openai: OpenAI | null;
  private debugMode: boolean;


  constructor(apiKey: string, debug: boolean = false) {
    this.games = new Map();
    this.debugMode = debug;
    this.openai = debug ? null : new OpenAI({ apiKey });
    Logger.info(`Game Manager initialized in ${debug ? 'debug' : 'production'} mode`);
  }

  async createGame(hostId: string, topics: string[]): Promise<Game> {
    Logger.info('Creating new game', { hostId, topics, debugMode: this.debugMode });
    const gameId = this.generateGameCode();

    try {
      // const questions = this.debugMode ?
      //   await this.generateQuestions(topics);
      const questions: Question[] = []; // 

      const game: Game = {
        id: gameId,
        hostId,
        status: 'waiting',
        players: [],
        currentQuestionIndex: 0,
        questions,
        createdAt: new Date()
      };

      this.games.set(gameId, game);
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

  private async generateQuestions(topics: string[]): Promise<Question[]> {
    if (this.debugMode) {
      Logger.info('Debug mode: Using mock questions');
      return mockQuestions;
    }

    Logger.info('Generating questions for topics', { topics });

    try {
      const prompt = `Create 10 multiple choice trivia questions about: ${topics.join(', ')}. 
                     Format each question with 4 options and indicate the correct answer index (0-3).`;

      const response = await this.openai!.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      Logger.success('Questions generated successfully');
      return []; // TODO: Parse AI response
    } catch (error) {
      Logger.error('Failed to generate questions', error);
      throw error;
    }
  }

  getGame(gameId: string): Game | null {
    return this.games.get(gameId) || null;
  }

  listGames(): string[] {
    return Array.from(this.games.keys());
  }

  joinGame(gameId: string, playerName: string): Player | null {
    Logger.info('Player attempting to join game', { gameId, playerName });

    const game = this.games.get(gameId);
    if (!game || game.status !== 'lobby') {
      Logger.warn('Join game failed - invalid game or status', { gameId, status: game?.status });
      return null;
    }

    const player: Player = {
      id: uuidv4(),
      name: playerName,
      score: 0,
      answers: []
    };

    game.players.push(player);
    Logger.success('Player joined game successfully', { gameId, playerId: player.id });
    return player;
  }


  createLobby(gameId: string, hostId: string): boolean {
    Logger.info('Attempting to create lobby', { gameId, hostId });

    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId || game.status !== "waiting") {
      Logger.warn('Create lobby failed - invalid game state', {
        gameExists: !!game,
        correctHost: game?.hostId === hostId,
        status: game?.status
      });
      return false;
    }

    game.status = "lobby";
    Logger.success("Lobby created - Players can now join", { gameId });

    return true;
  }


  startTrivia(gameId: string, hostId: string): boolean {
    Logger.info('Attempting to start trivia', { gameId, hostId });

    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId || game.status !== "lobby") {
      Logger.warn('Start trivia failed - invalid game state', {
        gameExists: !!game,
        correctHost: game?.hostId === hostId,
        status: game?.status
      });
      return false;
    }

    if (game.questions.length === 0) {
      Logger.info("Assigning mock questions to game", { gameId });
      game.questions = [...mockQuestions];
    }

    game.status = "in-progress";
    Logger.success("Trivia officially started", { gameId, playerCount: game.players.length });

    return true;
  }


  submitAnswer(gameId: string, playerId: string, answer: string): boolean {
    Logger.info('Processing answer submission', { gameId, playerId });

    const game = this.games.get(gameId);
    if (!game || game.status !== 'in-progress') {
      Logger.warn('Answer submission failed - invalid game state', { gameId, status: game?.status });
      return false;
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      Logger.warn('Answer submission failed - player not found', { gameId, playerId });
      return false;
    }

    const currentQuestion = game.questions[game.currentQuestionIndex];

    if (player.answers.some(a => a.questionIndex === game.currentQuestionIndex)) {
      Logger.warn('Duplicate answer detected', { gameId, playerId });
      return false;
    }

    player.answers.push({
      questionIndex: game.currentQuestionIndex,
      answer,
      timestamp: new Date()
    });

    if (currentQuestion.options[currentQuestion.correctAnswer] === answer) {
      player.score += 100;
      Logger.success('Correct answer submitted', { gameId, playerId, newScore: player.score });
    } else {
      Logger.info('Incorrect answer submitted', { gameId, playerId });
    }

    const allAnswered = game.players.every(p =>
      p.answers.some(a => a.questionIndex === game.currentQuestionIndex)
    );

    if (allAnswered) {
      Logger.success('All players have submitted answers, moving to results phase', { gameId });

      game.status = 'results';

      setTimeout(() => {
        this.nextQuestion(gameId);
      }, 5000);
    }

    return true;
  }


  nextQuestion(gameId: string): Question | null {
    Logger.info('Moving to next question', { gameId });

    const game = this.games.get(gameId);
    if (!game || game.status !== 'results') {
      Logger.warn('Next question failed - invalid game state', {
        gameExists: !!game,
        status: game?.status
      });
      return null;
    }

    setTimeout(() => {
      game.currentQuestionIndex++;

      if (game.currentQuestionIndex >= game.questions.length) {
        game.status = 'ended';
        Logger.info('Game ended - all questions completed', { gameId });
        return;
      }

      game.status = 'in-progress';

      Logger.success('Advanced to next question', {
        gameId,
        questionIndex: game.currentQuestionIndex,
        questionsRemaining: game.questions.length - game.currentQuestionIndex
      });
    }, 3000);

    return null;
  }






  getLeaderboard(gameId: string): Player[] {
    Logger.info('Fetching leaderboard', { gameId });

    const game = this.games.get(gameId);
    if (!game) {
      Logger.warn('Leaderboard request failed - game not found', { gameId });
      return [];
    }

    const leaderboard = [...game.players].sort((a, b) => b.score - a.score);
    Logger.info('Leaderboard generated', {
      gameId,
      playerCount: leaderboard.length,
      topScore: leaderboard[0]?.score
    });
    return leaderboard;
  }

  getCurrentQuestion(gameId: string): Question | null {
    Logger.info('Fetching current question', { gameId });

    const game = this.games.get(gameId);
    if (!game || game.status !== 'in-progress') {
      Logger.warn('Question fetch failed - invalid game state', { gameId, status: game?.status });
      return null;
    }

    Logger.info('Current question retrieved', {
      gameId,
      questionIndex: game.currentQuestionIndex
    });
    return game.questions[game.currentQuestionIndex];
  }

  endGame(gameId: string, hostId: string): boolean {
    Logger.info('Attempting to end game', { gameId, hostId });

    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId) {
      Logger.warn('End game failed - invalid game or host', {
        gameExists: !!game,
        correctHost: game?.hostId === hostId
      });
      return false;
    }

    game.status = 'ended';
    Logger.success('Game ended successfully', {
      gameId,
      finalScores: game.players.map(p => ({ name: p.name, score: p.score }))
    });
    return true;
  }
}

// router setup
const router = Router();
const isDebugMode = process.env.DEBUG_MODE === 'true';
const gameManager = new GameManager(process.env.OPENAI_API_KEY || '', isDebugMode);

// api endpoints
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

router.post('/games/:id/join', (req, res) => {
  Logger.info('POST /games/:id/join request received', {
    gameId: req.params.id,
    body: req.body
  });

  const { playerName } = req.body;
  const player = gameManager.joinGame(req.params.id, playerName);
  if (!player) {
    Logger.warn('Join game request failed');
    res.status(400).json({ error: 'Unable to join game' });
    return;
  }

  Logger.success('Join game request completed');
  res.json(player);
});

router.get('/games/:id/players', (req, res) => {
  const gameId = req.params.id;

  Logger.info('GET /games/:id/players request received', { gameId });
  console.log("Active Games in Memory: ", gameManager.listGames());
  const game = gameManager.getGame(gameId);
  if (!game) {
    Logger.warn('Get players request failed - game not found', { gameId });
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  Logger.success('Get players request completed', { players: game.players });
  res.json(game.players);
});

router.post('/games/:id/lobby', (req, res) => {
  Logger.info('POST /games/:id/lobby request received', {
    gameId: req.params.id,
    body: req.body
  });

  const { hostId } = req.body;
  const success = gameManager.createLobby(req.params.id, hostId);

  if (!success) {
    Logger.warn('Create lobby request failed');
    res.status(400).json({ error: 'Unable to create lobby' });
    return;
  }

  Logger.success('Lobby created successfully');
  res.json({ status: "lobby" });
});

router.post('/games/:id/start-trivia', (req, res) => {
  Logger.info('POST /games/:id/star-triviat request received', {
    gameId: req.params.id,
    body: req.body
  });

  const { hostId } = req.body;
  const success = gameManager.startTrivia(req.params.id, hostId);
  const game = gameManager.getGame(req.params.id);

  if (!success || !game) {
    Logger.warn('Start trivia request failed');
    res.status(400).json({ error: 'Unable to start trivia' });
    return;
  }

  Logger.success('Trivia started successfully');
  const question = gameManager.getCurrentQuestion(game.id);
  res.json({ status: "in-progress", question });
});

router.get('/games/:id/questions', (req, res) => {
  Logger.info('GET /games/:id/questions request received', { gameId: req.params.id });

  const question = gameManager.getCurrentQuestion(req.params.id);
  if (!question) {
    Logger.warn('Get question request failed');
    res.status(400).json({ error: 'No current question' });
    return;
  }

  Logger.success('Get question request completed');
  res.json(question);
});

router.get('/games/:id/results', (req, res) => {
  const gameId = req.params.id;
  Logger.info('GET /games/:id/results request received', { gameId });

  const game = gameManager.getGame(gameId);

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
});


router.get("/games/:id/status", (req, res) => {
  const gameId = req.params.id;
  Logger.info("GET /games/:id/status request received", { gameId });

  const game = gameManager.getGame(gameId);
  if (!game) {
    Logger.warn("Game status request failed - game not found", { gameId });
    res.status(404).json({ error: "Game not found" });
    return;
  }

  Logger.success("Game status request completed", { gameId, status: game.status });
  res.json({ status: game.status });
});


router.post('/games/:id/answer', (req, res) => {
  Logger.info('POST /games/:id/answer request received', {
    gameId: req.params.id,
    body: req.body
  });

  const { playerId, answer } = req.body;
  const success = gameManager.submitAnswer(req.params.id, playerId, answer);

  if (!success) {
    Logger.warn('Submit answer request failed');
    res.status(400).json({ error: 'Unable to submit answer' });
    return;
  }

  Logger.success('Submit answer request completed');
  res.json({ status: 'answer recorded' });
});

router.post('/games/:id/next-question', (req, res) => {
  Logger.info('POST /games/:id/next-question request received', { gameId: req.params.id });

  const gameId = req.params.id;
  const game = gameManager.getGame(gameId);

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

  const nextQuestion = gameManager.nextQuestion(gameId);

  if (!nextQuestion) {
    Logger.success('Game ended, no more questions remaining', { gameId });
    res.json({ status: 'ended' });
    return;
  }

  Logger.success('Moved to next question', { gameId, question: nextQuestion });
  res.json({ status: 'in-progress', question: nextQuestion });
});




export default router;