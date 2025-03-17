import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

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

      localStorage.setItem("playerId", response.data.id); // ✅ Store playerId

      return response.data;
    } catch (error: any) {
      console.error("Failed to join game:", error.response?.data || error.message);
      return null;
    }
  },

  async getGameStatus(gameId: string): Promise<{ status: string }> {
    try {
      console.log(`Checking game status for ${gameId}`);
      const response = await axios.get(`${API_BASE_URL}/games/${gameId}/status`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch game status:", error.response?.data || error.message);
      throw error;
    }
  },

  async submitAnswer(gameId: string, playerId: string, answer: string): Promise<any> {
    try {
      console.log(`Submitting answer for Player ${playerId} in Game ${gameId}`);

      const response = await axios.post(`${API_BASE_URL}/games/${gameId}/answer`, {
        playerId,
        answer
      });

      console.log("Answer submitted successfully:", response.data);

      return response.data;
    } catch (error: any) {
      console.error("Failed to submit answer:", error.response?.data || error.message);
      throw error;
    }
  },

  async getCurrentQuestion(gameId: string): Promise<{ text: string; options: string[]; questionIndex: number } | null> {
    try {
      console.log(`Fetching current question for game ${gameId}`);
      const response = await axios.get(`${API_BASE_URL}/games/${gameId}/questions`);

      if (response.data) {
        return {
          text: response.data.text,
          options: response.data.options,
          questionIndex: response.data.questionIndex ?? 0, // ✅ Ensure questionIndex exists
        };
      }

      return null;
    } catch (error: any) {
      console.error("Failed to fetch current question:", error.response?.data || error.message);
      return null;
    }
  },


  async pollForNextQuestion(
    gameId: string,
    callback: (question: any, gameStatus: string) => void
  ): Promise<() => void> {
    console.log(`Starting polling for next question in game ${gameId}`);

    let lastQuestionIndex = -1;
    let waitingForResults = true;

    const checkForNextQuestion = async () => {
      try {
        const status = await this.getGameStatus(gameId);

        if (status.status === "ended") {
          console.log("Game has ended, stopping polling.");
          clearInterval(interval);
          callback(null, "ended");
          return;
        }

        if (status.status === "results") {
          console.log("Game is in results phase, waiting...");
          waitingForResults = true;
          return;
        }

        if (waitingForResults && status.status === "in-progress") {
          const nextQuestion = await this.getCurrentQuestion(gameId);
          if (nextQuestion && nextQuestion.questionIndex > lastQuestionIndex) {
            lastQuestionIndex = nextQuestion.questionIndex;
            callback(nextQuestion, "in-progress");
            clearInterval(interval);
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





};
