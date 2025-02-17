import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const JoinRoom: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>(); // Get room code from the URL
  const [playerName, setPlayerName] = useState('');       // Player name state
  const [players, setPlayers] = useState<string[]>([]);   // Players list state
  const navigate = useNavigate();                        // Navigation hook

  // Simulate joining the room by fetching existing players (for demonstration purposes)
  useEffect(() => {
    if (roomCode) {
      // For now, we'll assume that the room code exists and there are some players.
      // You can replace this with an actual API call to fetch data.
      setPlayers(['Player 1', 'Player 2']); // Placeholder players
    }
  }, [roomCode]);

  // Handle joining the room
  const handleJoin = () => {
    if (playerName.trim()) {
      setPlayers([...players, playerName.trim()]);
      setPlayerName('');
    }
  };

  // Handle starting the game
  const startGame = () => {
    if (players.length > 0) {
      // You can pass any necessary data and navigate to the quiz page
      navigate(`/quiz/${roomCode}`, {
        state: { players }
      });
    }
  };

  return (
    <div>
      <h1>Welcome to Room: {roomCode}</h1>
      <h3>Players in the room:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>

      {/* Input to join the room */}
      <div>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
        />
        <button onClick={handleJoin}>Join Game</button>
      </div>

      {/* Start game button */}
      <button onClick={startGame} disabled={players.length === 0}>
        Start Game
      </button>
    </div>
  );
};

export default JoinRoom;
