import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameService } from "../services/gameService";
import "../styles/questionpage.css";

const QuestionAnswerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomCode } = location.state || {}; // Removed unused playerName

  const [question, setQuestion] = useState<{ text: string; options: string[]; questionIndex: number } | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and set up polling
  useEffect(() => {
    const fetchCurrentQuestion = async () => {
      try {
        console.log(`Fetching initial question for game: ${roomCode}`);
        const response = await gameService.getCurrentQuestion(roomCode);

        if (response) {
          setQuestion({ ...response });
          setCurrentQuestionIndex(response.questionIndex);
        }
      } catch (error) {
        console.error("Failed to fetch initial question:", error);
      }
    };

    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Check for game status and new questions every second
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // First check game status
          const status = await gameService.getGameStatus(roomCode);
          
          if (status.status === "ended") {
            console.log("Game has ended, navigating to game-over");
            clearInterval(pollingIntervalRef.current!);
            navigate("/game-over");
            return;
          }
          
          // Then check for new questions
          const latestQuestion = await gameService.getCurrentQuestion(roomCode);
          
          if (latestQuestion && latestQuestion.questionIndex > currentQuestionIndex) {
            console.log(`New question detected: ${latestQuestion.questionIndex} (current: ${currentQuestionIndex})`);
            setQuestion(latestQuestion);
            setCurrentQuestionIndex(latestQuestion.questionIndex);
            setAnswerSubmitted(false);
          }
          
        } catch (error) {
          console.error("Error in polling:", error);
        }
      }, 1000);
    };

    fetchCurrentQuestion();
    startPolling();

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [roomCode, navigate]);

  // Separate useEffect to watch currentQuestionIndex for debugging
  useEffect(() => {
    console.log(`Current question index updated to: ${currentQuestionIndex}`);
  }, [currentQuestionIndex]);

  const handleSubmitAnswer = async (answer: string) => {
    if (answerSubmitted) return;

    const playerId = localStorage.getItem("playerId");
    if (!roomCode || !playerId) return;

    try {
      console.log(`Submitting answer: ${answer} for player: ${playerId}`);
      await gameService.submitAnswer(roomCode, playerId, answer);
      setAnswerSubmitted(true);
      // Removed setSelectedAnswer since the state isn't being used
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  if (!question) {
    return <p className="loading-text">Loading question...</p>;
  }

  return (
    <div className="question-page">
      {answerSubmitted ? (
        <div className="waiting-container">
          <h1 className="answer-submitted-text">Answer Submitted</h1>
          <p className="waiting-text">Waiting for next question...</p>
        </div>
      ) : (
        <div className="answers">
          {question.options.map((option: string, index: number) => (
            <button
              key={index}
              className={`answer ${["blue", "green", "yellow", "red"][index]}`}
              onClick={() => handleSubmitAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionAnswerPage;