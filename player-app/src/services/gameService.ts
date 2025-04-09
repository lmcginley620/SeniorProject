import axios from "axios";

const API_BASE_URL = "https://us-central1-trivia-fusion.cloudfunctions.net/gameApi";

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

      localStorage.setItem("playerId", response.data.id);

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
          questionIndex: response.data.questionIndex ?? 0,
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
    currentIndex: number,
    callback: (question: any, gameStatus: string) => void
  ): Promise<() => void> {
    console.log(`Starting polling for next question in game ${gameId}`);

    let lastQuestionIndex = -1;
    
    // Get the current question to set the initial lastQuestionIndex
    try {
      const currentQuestion = await this.getCurrentQuestion(gameId);
      if (currentQuestion) {
        lastQuestionIndex = currentQuestion.questionIndex;
        console.log(`Initial question index: ${lastQuestionIndex}`);
      }
    } catch (error) {
      console.error("Error getting initial question index:", error);
    }

    const checkForNextQuestion = async () => {
      try {
        const status = await this.getGameStatus(gameId);
        console.log(`Game status: ${status.status}`);

        if (status.status === "ended") {
          console.log("Game has ended, stopping polling.");
          clearInterval(interval);
          callback(null, "ended");
          return;
        }

        // Always check for a new question regardless of game status
        const nextQuestion = await this.getCurrentQuestion(gameId);
        
        if (nextQuestion) {
          console.log(`Polled question index: ${nextQuestion.questionIndex}, last question index: ${lastQuestionIndex}`);
          
          // If we have a new question with a higher index, update and notify
          if (nextQuestion.questionIndex > lastQuestionIndex) {
            console.log(`New question detected: ${nextQuestion.questionIndex}`);
            lastQuestionIndex = nextQuestion.questionIndex;
            callback(nextQuestion, status.status);
          }
        }
        
      } catch (error) {
        console.error("Error polling for next question:", error);
      }
    };

    // Check more frequently (every 1 second)
    const interval = setInterval(checkForNextQuestion, 1000);

    // Return function to stop polling
    return () => {
      console.log("Stopping polling for next question.");
      clearInterval(interval);
    };
  }
};