import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/homepage.css";
import { gameService } from "../services/gameService";

const HomePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = location.state?.roomCode || "NO CODE";

  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    document.body.classList.add("homepage-body");
    return () => {
      document.body.classList.remove("homepage-body");
    };
  }, []);

  // ✅ Fetch players from game-server every 3 seconds (Polling)
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await gameService.getPlayers(roomCode);
        setPlayers(response.map((player: { name: string }) => player.name));
      } catch (error) {
        console.error("Failed to fetch players:", error);
      }
    };

    fetchPlayers(); // Initial fetch
    const interval = setInterval(fetchPlayers, 3000); // ✅ Poll every 3 seconds

    return () => clearInterval(interval);
  }, [roomCode]);

  const handleStartGame = () => {
    navigate("/question", { state: { roomCode } });
  };

  return (
    <div className="host-screen">
      <header className="game-title">
        <h1>TRIVIA FUSION</h1>
        <h2 className="sub-title">A Game by Luke McGinley & Owen Mitchell</h2>
      </header>

      <main className="middle-section">
        <div className="room-code-section">
          <p className="room-code">Enter Room Code:</p>
          <p className="room-code-value">{roomCode}</p>
        </div>
        <div className="qr-code-section">
          <p>Scan the QR Code to Join:</p>
          <QRCodeCanvas value={`http://localhost:5175/?room=${roomCode}`} size={180} />
        </div>
      </main>

      {/* ✅ Display Players in the Lobby */}
      <footer className="players-list">
        <h3>Players Joined:</h3>
        <div className="player-list">
          {players.length === 0 ? (
            <p>No players have joined yet...</p>
          ) : (
            players.map((player, idx) => (
              <div key={idx} className="player-entry animate-player">
                {player}
              </div>
            ))
          )}
        </div>
      </footer>

      <div className="start-button-container">
        <button className="start-game-button" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default HomePage;
