import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react"; 
import "../styles/homepage.css";
import socket from "../socket";

const HomePage: React.FC = () => {
  const [players, setPlayers] = useState<string[]>([]);
  const [roomCode, setRoomCode] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const newRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(newRoomCode);
  }, []);

  
  useEffect(() => {
    console.log("🔗 Attempting to connect to WebSocket...");


    socket.on("connect", () => {
      console.log("WebSocket connected");
      if (roomCode) {
        console.log(`Host joining room: ${roomCode}`);
        socket.emit("joinRoom", { roomCode, playerName: "Host" });
      }
    });

  
    socket.on("roomUpdate", (updatedPlayers: string[]) => {
      console.log("Host received updated players:", updatedPlayers);
      setPlayers(updatedPlayers.filter(player=> player !== "Host"));
    });

   
    return () => {
      socket.off("roomUpdate");
    };
  }, [roomCode]); 

  useEffect(() => {
    document.body.classList.add("homepage-body");
    return () => {
      document.body.classList.remove("homepage-body");
    };
  }, []);


  const handleStartGame = () => {
    navigate("/enter-topics");
  };

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
            <QRCodeCanvas value={`https://l23tlg32-5173.use.devtunnels.ms/?room=${roomCode}`} size={180} />
          </div>
        </div>
      </main>

      {/* Players List */}
      <footer className="players-list">
        <h3>Players Joined:</h3>
        <div className="player-list">
          {players.map((player, idx) => (
            <div key={idx} className="player-entry animate-player">
              {player}
            </div>
          ))}
        </div>
      </footer>

      {/* Start Game Button */}
      <div className="start-button-container">
        <button className="start-game-button" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default HomePage;
