"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MileageTrendPoint } from "@/types/metrics";

type MileageTrendChartProps = {
  data: MileageTrendPoint[];
};

export function MileageTrendChart({ data }: MileageTrendChartProps) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm" aria-labelledby="mileage-trend">
      <div>
        <h2 id="mileage-trend" className="text-lg font-semibold">
          Mileage trend
        </h2>
        <p className="text-sm text-muted-foreground">Current week through race week</p>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={42}
              domain={[0, "dataMax + 10"]}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value) => [`${Number(value).toFixed(1)} mi`, "Miles"]}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Area
              type="monotone"
              dataKey="miles"
              stroke="var(--foreground)"
              fill="var(--foreground)"
              fillOpacity={0.12}
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
