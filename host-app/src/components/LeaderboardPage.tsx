// src/pages/LeaderboardPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameService } from "../services/gameService";
import { Card } from "@/components/ui/card";
import "../styles/leaderboard.css"; // Optional: your custom leaderboard styles

const LeaderboardPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const roomCode = location.state?.roomCode || "NO CODE";

    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const leaderboardData = await gameService.getPlayers(roomCode);
                leaderboardData.sort((a: any, b: any) => b.score - a.score);
                setLeaderboard(leaderboardData);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            }
        };

        fetchLeaderboard();
    }, [roomCode]);

    const handleNewGameClick = () => {
        navigate("/start"); // Replace with actual route to StartGamePage
    };

    return (
        <div className="leaderboard-container">
            <div className="flex justify-center items-center min-h-screen flex-col">
                <Card className="w-[700px] p-8 shadow-xl rounded-lg bg-white dark:bg-gray-800">
                    <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">Final Leaderboard</h2>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="px-4 py-2 text-lg text-gray-700">#</th>
                                <th className="px-4 py-2 text-lg text-gray-700">Name</th>
                                <th className="px-4 py-2 text-lg text-gray-700">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((player, index) => (
                                <tr key={player.id} className="border-b border-gray-200">
                                    <td className="px-4 py-2 text-lg text-gray-900 dark:text-white font-semibold">{index + 1}</td>
                                    <td className="px-4 py-2 text-lg text-gray-900 dark:text-white">{player.name}</td>
                                    <td className="px-4 py-2 text-lg text-gray-900 dark:text-white">{player.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                <div className="mt-8">
                    <button
                        onClick={handleNewGameClick}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg shadow-md text-xl font-semibold transition duration-300"
                    >
                        New Game
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;
