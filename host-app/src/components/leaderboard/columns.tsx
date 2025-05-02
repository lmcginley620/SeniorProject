// src/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";

export type score = {
    position: string;
    score: number;
    username: string;
}

export const columns: ColumnDef<score>[] = [
    {
        accessorKey: "position",
        header: "Position",
    },
    {
        accessorKey: "username",
        header: "Username",
    },
    {
        accessorKey: "score",
        header: "Score",
    },
];
