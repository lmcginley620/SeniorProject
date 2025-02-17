import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const Quiz: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>(); // Get room ID from URL params
  const { state } = useLocation(); // Get state passed from Lobby
  const [players, setPlayers] = useState<string[]>([]); // List of players
  const [topics, setTopics] = useState<string[]>([]);   // List of topics

  useEffect(() => {
    if (state) {
      setPlayers(state.players || []);
      setTopics(state.topics || []);
    }
  }, [state]); // Load state from Lobby when available

  if (!roomId) {
    return <div>Loading...</div>; // Ensure roomId is available
  }

  return (
    <div>
      <h2>Quiz for Room: {roomId}</h2>
      <h3>Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
      <h3>Topics:</h3>
      <ul>
        {topics.map((topic, index) => (
          <li key={index}>{topic}</li>
        ))}
      </ul>
      {/* Render your quiz questions here */}
    </div>
  );
};

export default Quiz;
