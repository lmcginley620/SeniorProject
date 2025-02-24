import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api"; // ✅ Connect to game-server

export interface Player {
  id: string;
  name: string;
  score: number;
}

export const gameService = {
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
      return null;
    }
  }
};
