import express from 'express';
import { Router } from 'express';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Type Definitions
type GameStatus = 'lobby' | 'in-progress' | 'ended';

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
      const questions = this.debugMode ?
        mockQuestions :
        await this.generateQuestions(topics);

      const game: Game = {
        id: gameId,
        hostId,
        status: 'lobby',
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

  startGame(gameId: string, hostId: string): boolean {
    Logger.info('Attempting to start game', { gameId, hostId });

    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId || game.status !== 'lobby') {
      Logger.warn('Start game failed - invalid game state', {
        gameExists: !!game,
        correctHost: game?.hostId === hostId,
        status: game?.status
      });
      return false;
    }

    game.status = 'in-progress';
    Logger.success('Game started successfully', { gameId, playerCount: game.players.length });
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
    const isCorrect = currentQuestion.options[currentQuestion.correctAnswer] === answer;

    player.answers.push({
      questionIndex: game.currentQuestionIndex,
      answer,
      timestamp: new Date()
    });

    if (isCorrect) {
      player.score += 100;
      Logger.success('Correct answer submitted', {
        gameId,
        playerId,
        questionIndex: game.currentQuestionIndex,
        newScore: player.score
      });
    } else {
      Logger.info('Incorrect answer submitted', {
        gameId,
        playerId,
        questionIndex: game.currentQuestionIndex
      });
    }

    return true;
  }

  nextQuestion(gameId: string, hostId: string): Question | null {
    Logger.info('Moving to next question', { gameId, hostId });

    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId || game.status !== 'in-progress') {
      Logger.warn('Next question failed - invalid game state', {
        gameExists: !!game,
        correctHost: game?.hostId === hostId,
        status: game?.status
      });
      return null;
    }

    game.currentQuestionIndex++;
    if (game.currentQuestionIndex >= game.questions.length) {
      game.status = 'ended';
      Logger.info('Game ended - no more questions', { gameId });
      return null;
    }

    Logger.success('Advanced to next question', {
      gameId,
      questionIndex: game.currentQuestionIndex,
      questionsRemaining: game.questions.length - game.currentQuestionIndex
    });
    return game.questions[game.currentQuestionIndex];
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

router.post('/games/:id/start', (req, res) => {
  Logger.info('POST /games/:id/start request received', {
    gameId: req.params.id,
    body: req.body
  });

  const { hostId } = req.body;
  const success = gameManager.startGame(req.params.id, hostId);
  if (!success) {
    Logger.warn('Start game request failed');
    res.status(400).json({ error: 'Unable to start game' });
    return;
  }

  Logger.success('Start game request completed');
  res.json({ status: 'started' });
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

router.post('/games/:id/next', (req, res) => {
  Logger.info('POST /games/:id/next request received', {
    gameId: req.params.id,
    body: req.body
  });

  const { hostId } = req.body;
  const question = gameManager.nextQuestion(req.params.id, hostId);
  if (!question) {
    Logger.warn('Next question request failed');
    res.status(400).json({ error: 'Unable to move to next question' });
    return;
  }

  Logger.success('Next question request completed');
  res.json(question);
});

router.get('/games/:id/leaderboard', (req, res) => {
  Logger.info('GET /games/:id/leaderboard request received', { gameId: req.params.id });

  const leaderboard = gameManager.getLeaderboard(req.params.id);
  Logger.success('Get leaderboard request completed');
  res.json(leaderboard);
});

router.post('/games/:id/end', (req, res) => {
  Logger.info('POST /games/:id/end request received', {
    gameId: req.params.id,
    body: req.body
  });

  const { hostId } = req.body;
  const success = gameManager.endGame(req.params.id, hostId);
  if (!success) {
    Logger.warn('End game request failed');
    res.status(400).json({ error: 'Unable to end game' });
    return;
  }

  Logger.success('End game request completed');
  res.json({ status: 'ended' });
});

export default router;