"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastPoint } from "@/lib/status";

export function ForecastChart({
  points,
  minimum = 75,
}: {
  points: ForecastPoint[];
  minimum?: number;
}) {
  const colorFor = (pct: number) => {
    if (pct >= 90) return "#12B76A";
    if (pct >= minimum) return "#245BFF";
    if (pct >= 50) return "#F79009";
    return "#F04438";
  };

  return (
    <div className="h-56 w-full" data-testid="forecast-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 18, right: 4, left: -18, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted))" }}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted))" }}
          />
          <ReferenceLine
            y={minimum}
            stroke="hsl(var(--muted))"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <Bar dataKey="percentage" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive>
            {points.map((p) => (
              <Cell key={p.key} fill={colorFor(p.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
