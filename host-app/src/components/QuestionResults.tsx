"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameService } from "../services/gameService";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

import "../styles/questionresults.css";

// ✅ Colors for each answer option
const COLORS = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db"]; // Red, Yellow, Green, Blue

export function QuestionResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = location.state?.roomCode || "NO CODE";

  const [chartData, setChartData] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState<string>("Loading...");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState<string>("results");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await gameService.getGameResults(roomCode);
        console.log("Game results received in UI:", response);

        if (response) {
          const formattedData = Object.keys(response.results).map((option, index) => ({
            name: option,
            votes: response.results[option],
          }));

          setChartData(formattedData);
          setQuestionText(response.question);

          // Fetch leaderboard data
          const leaderboardData = await gameService.getPlayers(roomCode);
          leaderboardData.sort((a: any, b: any) => b.score - a.score); // Sort by score (highest to lowest)
          setLeaderboard(leaderboardData);
        } else {
          console.warn("No results received.");
        }
      } catch (error) {
        console.error("Failed to fetch game results:", error);
      }
    };

    fetchResults();
  }, [roomCode]);

  // ✅ Poll for next game status
  useEffect(() => {
    const pollStatus = setInterval(async () => {
      try {
        const status = await gameService.getGameStatus(roomCode);
        console.log("Polled game status:", status);

        if (status === "in-progress") {
          clearInterval(pollStatus);
          navigate("/question", { state: { roomCode } });
        } else if (status === "ended") {
          clearInterval(pollStatus);
          navigate("/leaderboard");
        }
      } catch (error) {
        console.error("Error checking game status:", error);
      }
    }, 1000); // ✅ Poll every second

    return () => clearInterval(pollStatus);
  }, [roomCode, navigate]);

  // ✅ Define Chart Configuration before using it in JSX
  const chartConfig = {
    votes: {
      label: "Votes",
    },
    ...chartData.reduce((acc, data, index) => {
      acc[data.name] = { label: data.name, color: COLORS[index] };
      return acc;
    }, {} as Record<string, { label: string; color: string }>),
  };

  return (
    <div className="results-page-bg">
      <div className="flex justify-center items-center min-h-screen">
        <Card className="flex flex-row w-[1100px] h-[750px] p-8 shadow-xl rounded-lg bg-white dark:bg-gray-800">

          {/* Left Side: Pie Chart (Shifted slightly to the left) */}
          <div className="flex flex-col w-2/3 items-end pr-12">
            <CardHeader className="flex justify-center items-center pb-4 text-center w-full">
              <CardTitle className="text-gray-900 dark:text-white text-4xl font-bold">
                {questionText}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center">
              <ChartContainer config={chartConfig} className="mx-auto w-[500px] h-[450px]">
                <PieChart width={500} height={500}>
                  <Pie
                    data={chartData}
                    dataKey="votes"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}                    fontSize={32}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend
                    verticalAlign="bottom"
                    align="center"
                    content={<ChartLegendContent nameKey="name" />}
                    className="text-4xl text-gray-800 dark:text-white mt-6"
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>

          </div>

          {/* Right Side: Leaderboard (Spaced more to the right) */}
          <div className="flex flex-col w-1/3 items-center border-l border-gray-300 pl-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Leaderboard</h2>
            <div className="w-full">
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
                      <td className="px-4 py-2 text-lg text-gray-900 dark:text-white font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-lg text-gray-900 dark:text-white">{player.name}</td>
                      <td className="px-4 py-2 text-lg text-gray-900 dark:text-white">{player.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
}
