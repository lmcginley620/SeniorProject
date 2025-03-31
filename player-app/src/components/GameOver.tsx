// src/components/GameOver.tsx
import React from "react";
import "../styles/gameover.css"
import "../styles/playerjoin.css";

const GameOver: React.FC = () => {
    return (
        <div className="player-page-container">
            <div className="player-page-content">
                <div className="player-page-logo">Game Over</div>
                <h2 className="player-page-title">Thanks for playing!</h2>
            </div>
        </div>
    );
};

export default GameOver;
