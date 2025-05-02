import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/gameover.css";
import "../styles/playerjoin.css";

const GameOver: React.FC = () => {
    const navigate = useNavigate();

    const handleJoinAnotherGame = () => {
        navigate("/"); // This should point to PlayerJoin.tsx (root path)
    };

    return (
        <div className="player-page-container">
            <div className="player-page-content">
                <div className="player-page-logo">Game Over</div>
                <h2 className="player-page-title">Thanks for playing!</h2>

                <button className="player-page-button" onClick={handleJoinAnotherGame}>
                    Join Another Game
                </button>
            </div>
        </div>
    );
};

export default GameOver;
