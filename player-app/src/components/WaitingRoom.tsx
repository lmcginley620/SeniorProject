import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameService } from "../services/gameService";
import "../styles/waitingroom.css";

const WaitingRoom: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = location.state?.roomCode || "NO CODE";
  const playerName = location.state?.playerName || "Unknown";

  const [gameStatus, setGameStatus] = useState("lobby");

  useEffect(() => {
    const checkGameStatus = async () => {
      try {
        const game = await gameService.getGameStatus(roomCode);
        setGameStatus(game.status);

        if (game.status === "in-progress") {
          navigate("/question-answer", { state: { roomCode, playerName } });
        }
      } catch (error) {
        console.error("Failed to fetch game status:", error);
      }
    };

    const interval = setInterval(checkGameStatus, 3000);

    return () => clearInterval(interval);
  }, [roomCode, navigate, playerName]);

  return (
    <div className="waiting-room-container">
      <h1 className="game-title">TRIVIA FUSION</h1>
      <h2>Waiting for Host to Start...</h2>
      <p>Room Code: {roomCode}</p>
      <p>Hi {playerName}!</p>
      <p className="loading-dots">● ● ●</p>
    </div>
  );
  
};

export default WaitingRoom;
