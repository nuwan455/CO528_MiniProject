"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface OverviewChartProps {
  data?: Array<{
    module: string;
    count: number;
  }>;
}

const fallbackData = [
  { module: "posts", count: 0 },
  { module: "jobs", count: 0 },
  { module: "events", count: 0 },
];

export function OverviewChart({ data = fallbackData }: OverviewChartProps) {
  return (
    <Card className="col-span-4 border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Engagement Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="module" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#121214", borderColor: "#27272a", borderRadius: "8px" }} itemStyle={{ color: "#f8f9fa" }} />
              <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
