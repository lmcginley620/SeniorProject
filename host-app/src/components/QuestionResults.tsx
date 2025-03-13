"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

// ✅ Colors for each section
const COLORS = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db"]; // Red, Yellow, Green, Blue

const chartData = [
  { name: "Chrome", visitors: 275 },
  { name: "Safari", visitors: 200 },
  { name: "Firefox", visitors: 187 },
  { name: "Edge", visitors: 173 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  Chrome: { label: "Chrome", color: COLORS[0] },
  Safari: { label: "Safari", color: COLORS[1] },
  Firefox: { label: "Firefox", color: COLORS[2] },
  Edge: { label: "Edge", color: COLORS[3] },
} satisfies ChartConfig;

export function QuestionResults() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#1e3c72] bg-cover bg-center"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 304 304' width='104' height='104'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M44.1 224a5 5 0 1 1 0 2H0v-2h44.1zm160 48a5 5 0 1 1 0 2H82v-2h122.1zm57.8-46a5 5 0 1 1 0-2H304v2h-42.1zm0 16a5 5 0 1 1 0-2H304v2h-42.1zm6.2-114a5 5 0 1 1 0 2h-86.2a5 5 0 1 1 0-2h86.2zm-256-48a5 5 0 1 1 0 2H0v-2h12.1zm185.8 34a5 5 0 1 1 0-2h86.2a5 5 0 1 1 0 2h-86.2zM258 12.1a5 5 0 1 1-2 0V0h2v12.1zm-64 208a5 5 0 1 1-2 0v-54.2a5 5 0 1 1 2 0v54.2zm48-198.2V80h62v2h-64V21.9a5 5 0 1 1 2 0zm16 16V64h46v2h-48V37.9a5 5 0 1 1 2 0z'/%3E%3C/svg%3E")`
    }}
  >
      {/* ✅ Increased width but kept a balanced height */}
      <Card className="flex flex-col w-[900px] h-[750px] p-8 shadow-xl rounded-lg bg-white dark:bg-gray-800">
        <CardHeader className="items-center pb-4 text-center">
          <CardTitle className="text-gray-900 dark:text-white text-4xl font-bold">
            Visitors by Browser
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-xl">
            January - June 2024
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center">
          {/* ✅ Balanced width and height for the chart */}
          <ChartContainer config={chartConfig} className="mx-auto w-[500px] h-[450px]">
            <PieChart width={500} height={500}>
              <Pie
                data={chartData}
                dataKey="visitors"
                cx="50%"
                cy="50%"
                outerRadius={150} // ✅ Reduced from 240 to 150 to fit properly
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                fontSize={32} // ✅ Slightly smaller font size for better fit
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>

              {/* ✅ Tooltip when hovering */}
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />

              {/* ✅ Legend at the bottom */}
              <ChartLegend
  verticalAlign="bottom" // ✅ Moves it higher
  align="center"
  content={<ChartLegendContent nameKey="name" />}
  className="-mt-1 text-2xl text-gray-800 dark:text-white" // ✅ Pulls it up further
/>

            </PieChart>
          </ChartContainer>
        </CardContent>

        {/* ✅ Footer with Trending Info */}
        <CardFooter className="flex flex-col items-center gap-3 text-md text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2 font-semibold">
            Trending up by 5.2% this month <TrendingUp className="h-6 w-6" />
          </div>
          <div>Showing total visitors for the last 6 months</div>
        </CardFooter>
      </Card>
    </div>
  );
}
