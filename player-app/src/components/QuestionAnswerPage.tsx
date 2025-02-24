import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { gameService } from "../services/gameService";
import "../styles/questionpage.css";

const QuestionAnswerPage: React.FC = () => {
  const location = useLocation();
  const { roomCode, playerName } = location.state || {};
  const [question, setQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false); // ✅ Track if the player answered

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log(`Fetching question for game: ${roomCode}`);
        const response = await gameService.getCurrentQuestion(roomCode);
        setQuestion(response);
      } catch (error) {
        console.error("Failed to fetch question:", error);
      }
    };

    fetchQuestion();
  }, [roomCode]);

  const handleSubmitAnswer = async (answer: string) => {
    if (answerSubmitted) return; // ✅ Prevent multiple submissions

    const playerId = localStorage.getItem("playerId");
    if (!roomCode || !playerId) return;

    try {
      console.log(`Submitting answer: ${answer} for player: ${playerId}`);
      await gameService.submitAnswer(roomCode, playerId, answer);
      setSelectedAnswer(answer);
      setAnswerSubmitted(true); // ✅ Lock submission after answering
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
        <h1 className="answer-submitted-text">Answer Submitted ✔</h1> // ✅ Show confirmation
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
