import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/playerjoin.css";

const PlayerPage: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (roomCode.length !== 4) {
      setError("Room code must be 4 characters long.");
      return;
    }
    if (!playerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, playerName }),
      });

      const data = await response.json();
      if (response.ok) {
        navigate(`/question?room=${roomCode}&player=${playerName}`);
      } else {
        setError(data.error || "Failed to join the game.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
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
