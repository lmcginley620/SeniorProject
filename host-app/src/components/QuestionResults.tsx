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
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

import "../styles/questionresults.css";

const COLORS = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db"];

export function QuestionResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = location.state?.roomCode || "NO CODE";

  const [chartData, setChartData] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState<string>("Loading...");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const totalTime = 10;
    const tick = 1000;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 1;
      setProgress(100 - (elapsed / totalTime) * 100);
      if (elapsed >= totalTime) clearInterval(interval);
    }, tick);

    return () => clearInterval(interval);
  }, []);

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

          const leaderboardData = await gameService.getPlayers(roomCode);
          leaderboardData.sort((a: any, b: any) => b.score - a.score);
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      gameService.nextQuestion(roomCode)
        .then(() => {
          console.log("Host advanced to next question.");
        })
        .catch((err) => {
          console.error("Failed to advance question:", err);
        });
    }, 10000); // matches the progress bar duration

    return () => clearTimeout(timeout);
  }, [roomCode]);


  useEffect(() => {
    const intervalRef = { current: 0 };

    const startPolling = () => {
      intervalRef.current = window.setInterval(async () => {
        try {
          const status = await gameService.getGameStatus(roomCode);
          console.log("[HOST] Polled game status:", status);

          if (status === "in-progress") {
            clearInterval(intervalRef.current);
            navigate("/question", { state: { roomCode } });
          } else if (status === "ended") {
            clearInterval(intervalRef.current);
            navigate("/leaderboard", { state: { roomCode } });
          }
        } catch (error) {
          console.error("Error checking game status:", error);
        }
      }, 1000);
    };

    startPolling();
    return () => clearInterval(intervalRef.current);
  }, [roomCode, navigate]);

  const chartConfig = {
    votes: { label: "Votes" },
    ...chartData.reduce((acc, data, index) => {
      acc[data.name] = { label: data.name, color: COLORS[index] };
      return acc;
    }, {} as Record<string, { label: string; color: string }>),
  };

  return (
    <div className="results-page-bg">
      <div className="w-full max-w-[1400px] mx-auto pt-12 px-4">
        <div className="mb-6">
          <Progress value={progress} className="h-3 rounded-full bg-gray-200 transition-all duration-5000" />
        </div>

        <div className="flex justify-center items-center min-h-screen">
          <Card className="flex flex-row w-[1400px] h-[750px] p-8 shadow-xl rounded-lg bg-white dark:bg-gray-800">

            <div className="flex flex-col w-2/3 items-center pr-12">
              <CardHeader className="flex justify-center items-center pb-4 text-center w-full">
                <CardTitle className="text-gray-900 dark:text-white text-4xl font-bold">
                  {questionText}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col items-center mt-6">
                <ChartContainer config={chartConfig} className="mx-auto w-[500px] h-[450px] mt-6">
                  <PieChart width={500} height={500}>
                    <Pie
                      data={chartData}
                      dataKey="votes"
                      cx="50%"
                      cy="55%"
                      outerRadius={150}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent === 0) return null;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={40}
                            fontWeight="bold"
                          >
                            {(percent * 100).toFixed(0)}%
                          </text>
                        );
                      }}
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
                        <td className="px-4 py-2 text-lg text-gray-900 dark:text-white font-semibold">{index + 1}</td>
                        <td className="px-4 py-2 text-lg text-gray-900 dark:text-white">{player.name}</td>
                        <td className="px-4 py-2 text-lg text-gray-900 dark:text-white font-semibold">
                          {player.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </Card>
        </div>
      </div>
    </div>
  );
}
