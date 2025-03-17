// src/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of the leaderboard data.
export type Payment = {
    position: string;  // Position of the player in the leaderboard
    score: number;     // Score of the player
    username: string;  // Username or email of the player
}

export const columns: ColumnDef<Payment>[] = [
    {
        accessorKey: "position", // The position of the player in the leaderboard
        header: "Position",
    },
    {
        accessorKey: "username", // The player's username
        header: "Username",
    },
    {
        accessorKey: "score", // The player's score
        header: "Score",
    },
];
