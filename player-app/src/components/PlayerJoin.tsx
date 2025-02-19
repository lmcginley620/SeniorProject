import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/playerjoin.css";
import socket from "../socket";

const PlayerPage: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (roomCode.length !== 4) {
      setError("Room code must be 4 characters long.");
      return;
    }
    if (!playerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    console.log(`🔹 Attempting to send joinRoom event for Player: ${playerName}, Room: ${roomCode}`);

    socket.emit("joinRoom", { roomCode, playerName });

    socket.on("roomUpdate", (updatedPlayers) => {
      console.log(`🎯 Received roomUpdate in player app:`, updatedPlayers);
    });

    navigate(`/question-answer?room=${roomCode}&player=${playerName}`);
  };

  return (
    <div className="player-page-container">
      <div className="player-page-content">
        <h1 className="player-page-logo">TRIVIA FUSION</h1>
        <h2 className="player-page-title">Join Game</h2>
        <form className="player-page-form" onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Enter Room Code"
            className="player-page-input"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <input
            type="text"
            placeholder="Enter Your Name"
            className="player-page-input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="player-page-button">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerPage;
