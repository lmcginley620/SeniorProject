import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameService } from "../services/gameService";
import "../styles/questionpage.css";

const QuestionAnswerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomCode, playerName } = location.state || {};

  const [question, setQuestion] = useState<{ text: string; options: string[]; questionIndex: number } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [isPolling, setIsPolling] = useState(false);

  // ✅ Fetch the current question when the page loads
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log(`Fetching question for game: ${roomCode}`);
        const response = await gameService.getCurrentQuestion(roomCode);

        if (response) {
          setQuestion({ ...response }); // ✅ Ensure a new object reference for React to detect state change
          setCurrentQuestionIndex(response.questionIndex ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch question:", error);
      }
    };

    fetchQuestion();
  }, [roomCode]);

  // ✅ Handle answer submission
  const handleSubmitAnswer = async (answer: string) => {
    if (answerSubmitted) return; // ✅ Prevent multiple submissions

    const playerId = localStorage.getItem("playerId");
    if (!roomCode || !playerId) return;

    try {
      console.log(`Submitting answer: ${answer} for player: ${playerId}`);
      await gameService.submitAnswer(roomCode, playerId, answer);
      setSelectedAnswer(answer);
      setAnswerSubmitted(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  // ✅ Poll for the next question
  useEffect(() => {
    let stopPolling: (() => void) | null = null;

    const startPolling = async () => {
      if (answerSubmitted && !isPolling) {
        setIsPolling(true);

        stopPolling = await gameService.pollForNextQuestion(roomCode, (nextQuestion, gameStatus) => {
          if (gameStatus === "ended") {
            console.log("Game has ended, navigating to leaderboard.");
            if (stopPolling) stopPolling();
            navigate("/leaderboard", { state: { roomCode } });
            return;
          }

          if (gameStatus === "results") {
            console.log("Game in results phase, waiting for host to move forward.");
            return;
          }

          if (nextQuestion && nextQuestion.questionIndex > currentQuestionIndex) {
            console.log("New question detected, updating UI.");
            setQuestion({ ...nextQuestion });
            setCurrentQuestionIndex(nextQuestion.questionIndex);
            setAnswerSubmitted(false);
            setSelectedAnswer(null);
            setIsPolling(false);
            if (stopPolling) stopPolling();
          }
        });
      }
    };

    startPolling();

    return () => {
      if (stopPolling) stopPolling();
    };
  }, [answerSubmitted, currentQuestionIndex, roomCode, navigate]);

  if (!question) {
    return <p className="loading-text">Loading question...</p>;
  }

  return (
    <div className="question-page">
      {answerSubmitted ? (
        <h1 className="answer-submitted-text">Answer Submitted ✔</h1>
      ) : (
        <div className="answers">
          {question.options.map((option: string, index: number) => (
            <button
              key={index}
              className={`answer ${["red", "blue", "green", "yellow"][index]}`}
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
