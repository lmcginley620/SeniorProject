import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Game {
  id: string;
  hostId: string;
  status: 'waiting' | 'lobby' | 'in-progress' | 'ended';
  players: Player[];
  currentQuestionIndex: number;
  questions: Question[];
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

class GameService {
  private hostId: string;

  constructor() {
    this.hostId = localStorage.getItem('hostId') || this.generateHostId();
    localStorage.setItem('hostId', this.hostId);
  }

  private generateHostId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // ✅ Step 1: Create the Game
  async createGame(): Promise<Game> {
    try {
      console.log('Creating new game with hostId:', this.hostId);
      const response = await axios.post(`${API_BASE_URL}/games`, {
        hostId: this.hostId,
        topics: [] // Topics will be added later
      });
      console.log('Game created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create game:', error.response?.data || error.message);
      throw error;
    }
  }

  // ✅ Step 2: Move the game to "lobby" so players can join
  async createLobby(gameId: string): Promise<any> {
    try {
      console.log(`Creating lobby for game ID: ${gameId}`);

      const hostId = localStorage.getItem("hostId");
      if (!hostId) {
        throw new Error("Host ID not found in localStorage.");
      }

      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/lobby`, { hostId });
      console.log("Lobby created successfully:", response.data);

      return response.data;
    } catch (error: any) {
      console.error("Failed to create lobby:", error.response?.data || error.message);
      throw error;
    }
  }

  async startTrivia(gameId: string): Promise<any> {
    try {
      console.log(`Starting trivia for game ID: ${gameId}`);

      const hostId = localStorage.getItem("hostId");
      if (!hostId) {
        throw new Error("Host ID not found in localStorage.");
      }

      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/start-trivia`, { hostId });
      console.log("Trivia started successfully:", response.data);

      return response.data; // ✅ Returns the first question
    } catch (error: any) {
      console.error("Failed to start trivia:", error.response?.data || error.message);
      throw error;
    }
  }


  // ✅ Step 4: Player Joins the Game (Only Allowed in "lobby" State)
  async joinGame(gameId: string, playerName: string): Promise<Player | null> {
    try {
      console.log(`Joining game ${gameId} as ${playerName}`);
      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/join`, { playerName });

      if (!response.data) {
        throw new Error("Invalid server response: No data received");
      }

      console.log("Joined game:", response.data);
      return response.data;
    } catch (error: any) {
      // ✅ If game is already "in-progress", show an error message
      if (error.response?.status === 400) {
        console.error("Game is already in progress. Cannot join.");
        return null;
      }

      console.error("Failed to join game:", error.response?.data || error.message);
      return null;
    }
  }

  // ✅ Step 5: Get the List of Players in a Game
  async getPlayers(gameId: string): Promise<Player[]> {
    try {
      console.log(`Fetching players for game ${gameId}`);
      const response = await axios.get(`${API_BASE_URL}/games/${gameId}/players`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch players:", error.response?.data || error.message);
      return [];
    }
  }

  async getQuestion(gameId: string): Promise<Question | null> {
    try {
      console.log(`Fetching current question for game ${gameId}`);
      const response = await axios.get(`${API_BASE_URL}/games/${gameId}/questions`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch question:", error.response?.data || error.message);
      return null;
    }
  }

}

export const gameService = new GameService();
