import React, { useEffect, useState, useRef } from "react";
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
  const stopPollingRef = useRef<(() => void) | null>(null) as React.MutableRefObject<() => void | null>;


  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log(`Fetching question for game: ${roomCode}`);
        const response = await gameService.getCurrentQuestion(roomCode);

        if (response) {
          setQuestion({ ...response });
          setCurrentQuestionIndex(response.questionIndex ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch question:", error);
      }
    };

    fetchQuestion();
  }, [roomCode]);

  const handleSubmitAnswer = async (answer: string) => {
    if (answerSubmitted) return;

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

  useEffect(() => {
    let stopPolling: (() => void) | null = null;

    const startPolling = async () => {
      if (answerSubmitted && !isPolling) {
        setIsPolling(true);

        stopPolling = await gameService.pollForNextQuestion(
          roomCode,
          currentQuestionIndex,
          (nextQuestion, gameStatus) => {
            if (gameStatus === "ended") {
              stopPollingRef.current?.(); // Stop polling if needed
              navigate("/game-over");
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
              stopPollingRef.current?.(); // Stop current polling cycle
            }
          }
        );

        stopPollingRef.current = stopPolling; // Store stop function in ref
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
        <h1 className="answer-submitted-text">Answer Submitted</h1>
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
