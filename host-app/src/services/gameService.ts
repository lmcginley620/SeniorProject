import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Game {
  id: string;
  hostId: string;
  status: 'lobby' | 'in-progress' | 'ended';
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

  async startGame(gameId: string): Promise<void> {
    try {
      console.log(`Starting game with ID: ${gameId}`);
  
      const hostId = localStorage.getItem("hostId"); // ✅ Ensure correct hostId
      if (!hostId) {
        throw new Error("Host ID not found in localStorage.");
      }
  
      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/start`, { hostId });
  
      console.log("Game started successfully:", response.data);
    } catch (error: any) {
      console.error("Failed to start game:", error.response?.data || error.message);
      throw error;
    }
  }
  
  

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
      console.error("Failed to join game:", error.response?.data || error.message);
      return null; // Return null instead of throwing error
    }
  }
  
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
  
}

export const gameService = new GameService();
