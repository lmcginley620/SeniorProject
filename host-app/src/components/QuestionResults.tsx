"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gameService } from "../services/gameService";
import { Pie, PieChart, Cell } from "recharts";
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

// ✅ Colors for each answer
const COLORS = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db"]; // Red, Yellow, Green, Blue

export function QuestionResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = location.state?.roomCode || "NO CODE";

  const [chartData, setChartData] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState<string>("Loading...");
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

  // ✅ Define Chart Config
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
    <div className="flex justify-center items-center min-h-screen bg-[#1e3c72] bg-cover bg-center">
      <Card className="flex flex-col w-[900px] h-[750px] p-8 shadow-xl rounded-lg bg-white dark:bg-gray-800">
        <CardHeader className="items-center pb-4 text-center">
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
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                fontSize={32}
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
                className="text-2xl text-gray-800 dark:text-white"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-3 text-md text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2 font-semibold">
            Results will display for 5 seconds <TrendingUp className="h-6 w-6" />
          </div>
          <div>Next question will load automatically.</div>
        </CardFooter>
      </Card>
    </div>
  );
}
