import React from 'react';

const EndGamePage: React.FC = () => {
  return (
    <div className="end-game-page">
      <h1>Game Over!</h1>
      <h2>Leaderboard</h2>
      <ul>
        <li>Player 1 - 50 points</li>
        <li>Player 2 - 40 points</li>
        <li>Player 3 - 30 points</li>
      </ul>
    </div>
  );
};

export default EndGamePage; 
