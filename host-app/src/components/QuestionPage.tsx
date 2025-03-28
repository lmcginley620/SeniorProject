import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameService } from "../services/gameService";
import "../styles/questionpage.css";

const QuestionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const roomCode = location.state?.roomCode || "NO CODE";
  const initialQuestion = location.state?.question || null;

  const [question, setQuestion] = useState(initialQuestion);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    document.body.classList.add("question-page-body");
    return () => {
      document.body.classList.remove("question-page-body");
    };
  }, []);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!question) {
        try {
          const newQuestion = await gameService.getQuestion(roomCode);
          setQuestion(newQuestion);
        } catch (error) {
          console.error("Failed to fetch question:", error);
        }
      }
    };

    fetchQuestion();
  }, [question, roomCode]);

  // ✅ Poll game status to detect results phase
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await gameService.getGameStatus(roomCode);
        if (status === "results") {
          navigate("/question-result", { state: { roomCode } }); // ✅ Auto-navigate to results page
        }
      } catch (error) {
        console.error("Error checking game status:", error);
      }
    }, 1000); // ✅ Check status every second

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [roomCode, navigate]);

  if (!question) {
    return <p>Loading question...</p>;
  }

  const answerColors = ["blue", "green", "yellow", "red"];

  return (
    <div className="question-page-wrapper">
      <div className="content-wrapper">
        <div className="question-number">Question #{currentQuestionIndex}</div>
        <div className="question-page-container">
          <div className="question-box">
            <h1>{question.text}</h1>
          </div>
          <div className="answers">
            {question.options.map((option: string, index: number) => (
              <div key={index} className={`option ${answerColors[index]}`}>
                {option}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;
