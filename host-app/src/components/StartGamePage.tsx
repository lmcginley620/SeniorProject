import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600">
      <h1 className="text-4xl font-bold text-white mb-8">Trivia Fusion</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleStartGame}
        disabled={isLoading}
        className={`px-8 py-4 text-xl font-semibold rounded-lg ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
        } text-white transition-colors shadow-lg hover:shadow-xl`}
      >
        {isLoading ? 'Creating Game...' : 'Start New Game'}
      </button>
    </div>
  );
};

export default StartGamePage;
