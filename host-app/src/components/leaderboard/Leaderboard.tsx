// src/components/Leaderboard.tsx
"use client";

import React from "react";
import { Payment, columns } from "./columns";
import { DataTable } from "./data-table";
import "../../styles/leaderboard.css"; // Ensure CSS is imported

// Simulate getting leaderboard data from an API
async function getData(): Promise<Payment[]> {
    return [
        { position: "1", score: 100, username: "player1" },
        { position: "2", score: 200, username: "player2" },
        { position: "3", score: 50, username: "player3" },
    ];
}

const Leaderboard: React.FC = () => {
    const [data, setData] = React.useState<Payment[]>([]);

    // Fetch leaderboard data on mount
    React.useEffect(() => {
        getData().then(setData);
    }, []);

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-content">
                <h1 className="leaderboard-title">Leaderboard</h1>
                <DataTable columns={columns} data={data} /> {/* Display the leaderboard data */}
            </div>
        </div>
    );
};

export default Leaderboard;
