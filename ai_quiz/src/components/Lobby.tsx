import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Lobby: React.FC = () => {
  const [players, setPlayers] = useState<string[]>([]); // State for player names
  const [input, setInput] = useState('');                // State for input field
  const [roomCode, setRoomCode] = useState<string>('');  // State for the Room Code
  const [joinRoomCode, setJoinRoomCode] = useState('');  // State for room code to join
  const navigate = useNavigate();                        // Navigation hook

  // Function to generate a random 4-letter code
  const generateRoomCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  };

  // Add player to the list
  const addPlayer = () => {
    if (input.trim()) {
      setPlayers([...players, input.trim()]);
      setInput(''); // Clear input after adding
    }
  };

  // Create a new room and set room code
  const createRoom = () => {
    const newRoomCode = generateRoomCode();
    setRoomCode(newRoomCode); // Set the room code
  };

  // Start the game
  const startGame = () => {
    if (players.length > 0 && roomCode) {
      // Navigate to the quiz page and pass room data
      navigate(`/join/${roomCode}`, {
        state: { players }
      });
    }
  };

  // Handle joining an existing room
  const joinRoom = () => {
    if (joinRoomCode.trim()) {
      // Navigate to the room join page with the entered code
      navigate(`/join/${joinRoomCode}`);
    }
  };

  return (
    <div>
      <h1>Trivia Mashup</h1>

      {/* Room Creation Button */}
      {!roomCode && (
        <div>
          <button onClick={createRoom}>Create Room</button>
        </div>
      )}

      {/* Display room code after creation */}
      {roomCode && (
        <div>
          <h2>Room Created!</h2>
          <p>Room Code: {roomCode}</p>
          <h3>Share this code with others to join:</h3>
        </div>
      )}

      {/* Input field for player name */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter player name"
      />
      <button onClick={addPlayer}>Add Player</button>

      {/* Display Players List */}
      <h3>Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>

      {/* Start Game Button */}
      <button onClick={startGame} disabled={players.length === 0 || !roomCode}>
        Start Game
      </button>

      {/* Join Room Section */}
      <div>
        <h2>Join an Existing Room</h2>
        <input
          type="text"
          value={joinRoomCode}
          onChange={(e) => setJoinRoomCode(e.target.value)}
          placeholder="Enter Room Code"
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
};

export default Lobby;
