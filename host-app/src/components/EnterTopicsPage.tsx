import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';
import '../styles/entertopics.css';

const EnterTopicsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = location.state?.roomCode || 'No Room Code';

  const [topics, setTopics] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addTopic = () => {
    if (inputValue.trim() !== '') {
      setTopics([...topics, inputValue.trim()]);
      setInputValue('');
    }
  };

  const createLobby = async () => {
    try {
      console.log("Creating lobby...");
      await gameService.createLobby(roomCode);
      navigate('/lobby', { state: { roomCode, topics } });
    } catch (err) {
      setError('Failed to create lobby. Please try again.');
    }
  };

  return (
    <div className="enter-topics-container">
      {/* <h1 className="room-code-display">Room Code: {roomCode}</h1> */}

      <h1 className="enter-topics-title">Enter Trivia Topics</h1>

      <div className="topics-input-section">
        <input
          type="text"
          placeholder="Enter a topic..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="topic-input"
        />
        <button onClick={addTopic} className="add-topic-button">
          Add
        </button>
      </div>

      <div className="topics-list">
        {topics.map((topic, index) => (
          <div key={index} className="topic-item">
            {topic}
            <button onClick={() => setTopics(topics.filter((_, i) => i !== index))} className="remove-topic-button">
              ✖
            </button>
          </div>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}

      <button className="start-trivia-button" onClick={createLobby} disabled={topics.length === 0}>
        Create Lobby
      </button>
    </div>
  );
};

export default EnterTopicsPage;
