import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Game {
  id: string;
  hostId: string;
  status: 'waiting' | 'lobby' | 'in-progress' | 'results' | 'ended';
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
  questionIndex: number;
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
        topics: []
      });
      console.log('Game created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create game:', error.response?.data || error.message);
      throw error;
    }
  }

  // ✅ Step 2: Move the game to "lobby" so players can join
  async createLobby(gameId: string, topics: string[]): Promise<any> {
    try {
      console.log(`Creating lobby for game ID: ${gameId} with topics:`, topics);

      const hostId = localStorage.getItem("hostId");
      if (!hostId) {
        throw new Error("Host ID not found in localStorage.");
      }

      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/lobby`, {
        hostId,
        topics
      });

      console.log("Lobby created successfully with questions:", response.data.questions);
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

      return response.data;
    } catch (error: any) {
      console.error("Failed to start trivia:", error.response?.data || error.message);
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
      if (error.response?.status === 400) {
        console.error("Game is already in progress. Cannot join.");
        return null;
      }

      console.error("Failed to join game:", error.response?.data || error.message);
      return null;
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


  async getGameStatus(gameId: string): Promise<'waiting' | 'lobby' | 'in-progress' | 'results' | 'ended' | null> {
    try {
      console.log(`Fetching game status for game ${gameId}`);
      const response = await axios.get(`${API_BASE_URL}/games/${gameId}/status`);
      return response.data.status;
    } catch (error: any) {
      console.error("Failed to fetch game status:", error.response?.data || error.message);
      return null;
    }
  }

  async nextQuestion(gameId: string): Promise<Question | null> {
    try {
      console.log(`Advancing to next question for game ${gameId}`);
      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/next-question`);

      if (response.data.status === 'ended') {
        console.log("Game has ended.");
        return null;
      }

      return response.data.question;
    } catch (error: any) {
      console.error("Failed to advance question:", error.response?.data || error.message);
      return null;
    }
  }

  async submitAnswer(gameId: string, playerId: string, answer: string): Promise<boolean> {
    try {
      console.log(`Submitting answer for player ${playerId} in game ${gameId}`);
      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/answer`, { playerId, answer });

      if (response.data.status === 'answer recorded') {
        console.log("Answer submitted successfully.");
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("Failed to submit answer:", error.response?.data || error.message);
      return false;
    }
  }

  async pollGameStatus(gameId: string, callback: (status: string) => void) {
    try {
      const checkStatus = async () => {
        const status = await this.getGameStatus(gameId);
        if (status) {
          callback(status);
        }
      };

      // Check every second
      const interval = setInterval(checkStatus, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Error polling game status:", error);
    }
  }

  async getGameResults(gameId: string): Promise<{ question: string; results: Record<string, number> } | null> {
    try {
      console.log(`Fetching results for game ${gameId}`);
      const response = await axios.get(`${API_BASE_URL}/games/${gameId}/results`);

      if (!response.data || !response.data.results) {
        console.warn("No results data received.");
        return null;
      }

      console.log("Received game results:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch game results:", error.response?.data || error.message);
      return null;  // Prevents breaking the UI if results fail
    }
  }


  async pollForNextQuestion(
    gameId: string,
    callback: (question: any, gameStatus: string) => void
  ): Promise<() => void> {
    console.log(`Starting polling for next question in game ${gameId}`);

    let lastQuestionIndex = -1;
    let waitingForResults = false;

    const checkForNextQuestion = async () => {
      try {
        const status = await this.getGameStatus(gameId);

        if (status === "ended") {
          console.log("Game has ended, stopping polling.");
          clearInterval(interval);
          callback(null, "ended");
          return;
        }

        if (status === "results") {
          console.log("Game is in results phase, waiting...");
          waitingForResults = true;
          return;
        }

        // ✅ Keep polling until the new question actually changes
        if (waitingForResults && status === "in-progress") {
          console.log("Game moved from results to in-progress, checking for new question...");

          const nextQuestion = await this.getQuestion(gameId);
          console.log("Fetched next question:", nextQuestion);

          if (nextQuestion && nextQuestion.questionIndex > lastQuestionIndex) {
            lastQuestionIndex = nextQuestion.questionIndex;
            callback(nextQuestion, "in-progress");
            console.log("New question detected, stopping polling.");
            clearInterval(interval);
          } else {
            console.log("New question not detected yet, continuing to poll...");
          }
        }
      } catch (error) {
        console.error("Error polling for next question:", error);
      }
    };

    const interval = setInterval(checkForNextQuestion, 1000);

    return () => {
      console.log("Stopping polling for next question.");
      clearInterval(interval);
    };
  }




}

export const gameService = new GameService();
