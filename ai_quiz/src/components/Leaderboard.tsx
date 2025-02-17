import React from 'react';

const Leaderboard: React.FC = () => {
  // TODO: Replace with dynamic scores
  const scores = [
    { name: 'Alice', score: 100 },
    { name: 'Bob', score: 80 },
    { name: 'Charlie', score: 60 },
  ];

  return (
    <div>
      <h1>Leaderboard</h1>
      <ol>
        {scores.map((player, index) => (
          <li key={index}>
            {player.name}: {player.score} points
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;
