import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';
import "../styles/startgamepage.css";


const StartGamePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStartGame = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const game = await gameService.createGame();
      console.log('Game created:', game);
      navigate('/enter-topics', { state: { roomCode: game.id } });
    } catch (err) {
      setError('Failed to create game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="start-game-container">
      <div className="start-game-content">
        <h1 className="split-title">
          <span className="title-part left">Trivia</span>
          <span className="title-part right">Fusion</span>
        </h1>

        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className={`start-game-button ${isLoading ? 'disabled' : ''}`}
        >
          {isLoading ? 'Creating Game...' : 'Start New Game'}
        </button>

        {error && <div className="start-game-error">{error}</div>}
      </div>
    </div>

  );
};

export default StartGamePage;
