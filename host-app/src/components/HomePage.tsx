import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react"; // Import QR Code component
import "../styles/homepage.css";

const HomePage: React.FC = () => {
  const [players, setPlayers] = useState<string[]>([]);
  const [roomCode, setRoomCode] = useState<string>("");
  const [index, setIndex] = useState(0);
  const mockPlayers = ["Luke", "Owen", "Dr. Chang"];
  const navigate = useNavigate();


  // Function to generate a random 4-digit number
  const generateRoomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const qrUrl = "https://l23tlg32-5173.use.devtunnels.ms/";

  // Generate room code once when the component mounts
  useEffect(() => {
    setRoomCode(generateRoomCode());
  }, []);


  useEffect(() => {
    document.body.classList.add("homepage-body");
    return () => {
      document.body.classList.remove("homepage-body");
    };
  }, []);

  // Function to handle Start button click
  const handleStartGame = () => {
    navigate("/enter-topics");
  };

  useEffect(() => {
    if (index >= mockPlayers.length) return; // Stop when all players are added

    const interval = setInterval(() => {
      setPlayers((prevPlayers) => {
        const newPlayer = mockPlayers[index]; // Ensure correct indexing
        if (!newPlayer) return prevPlayers; // Prevent empty names
        console.log(`Adding player: ${newPlayer}`); // Debugging log
        return [...prevPlayers, newPlayer];
      });

      setIndex((prevIndex) => prevIndex + 1); // Update index properly
    }, 2000);

    return () => clearInterval(interval);
  }, [index]); // Depend on `index` to ensure updates

  return (
    <div className="host-screen">
      <header className="game-title">
        <h1 className="animate__animated animate__jackInTheBox animate__slower">
          TRIVIA FUSION
        </h1>
        <h2 className="sub-title">A Game by Luke McGinley & Owen Mitchell</h2>
      </header>

      <main className="middle-section">
        <div className="room-code-section">
          <p className="room-code">Enter Room Code:</p>
          <p className="room-code-value">{roomCode}</p>
        </div>
        <div className="qr-code-section">
          <p>Scan the QR Code to Join:</p>
          <div className="qr-code">
            <QRCodeCanvas value={qrUrl} size={180} />
          </div>
        </div>
      </main>

      {/* Players List */}
      <footer className="players-list">
        <h3>Players Joined:</h3>
        <ol>
          {players.map((player, idx) => (
            <li key={idx} className="player-entry animate-player">
              {player}
            </li>
          ))}
        </ol>
      </footer>

      {/* Start Game Button (Fixed Placement & Styling) */}
      <div className="start-button-container">
        <button className="start-game-button" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default HomePage;
