import { Activity, Dumbbell, Footprints, Moon, TrendingUp } from "lucide-react";
import type { WeeklyMetrics } from "@/types/metrics";

type WeeklySummaryCardProps = {
  metrics: WeeklyMetrics;
};

function formatPercent(value?: number) {
  if (value === undefined) {
    return "--";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function WeeklySummaryCard({ metrics }: WeeklySummaryCardProps) {
  const summaryItems = [
    { label: "Run days", value: metrics.runningDays, icon: Footprints },
    { label: "Rest", value: metrics.restDays, icon: Moon },
    { label: "Cross", value: metrics.crossTrainingDays, icon: Activity },
    { label: "Strength", value: metrics.strengthDays, icon: Dumbbell },
  ];

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm" aria-labelledby="weekly-summary">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Current week</p>
          <h1 id="weekly-summary" className="mt-1 text-2xl font-semibold tracking-normal">
            Weekly summary
          </h1>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TrendingUp className="size-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-secondary p-3">
          <p className="text-2xl font-semibold">{metrics.totalMiles.toFixed(1)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Miles</p>
        </div>
        <div className="rounded-md bg-secondary p-3">
          <p className="text-2xl font-semibold">{metrics.speedPercentage.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Speed</p>
        </div>
        <div className="rounded-md bg-secondary p-3">
          <p className="text-2xl font-semibold">{metrics.longRunPercentage.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Long run</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Speed miles</p>
          <p className="mt-1 text-lg font-semibold">{metrics.speedMiles.toFixed(1)}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Long run</p>
          <p className="mt-1 text-lg font-semibold">{metrics.longRunMiles.toFixed(1)} mi</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Mileage change</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPercent(metrics.mileageChangePercentage)}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Quality</p>
          <p className="mt-1 text-lg font-semibold">{metrics.qualitySessionCount}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="rounded-md bg-muted p-2 text-center">
              <Icon className="mx-auto size-4 text-muted-foreground" aria-hidden="true" />
              <p className="mt-1 text-lg font-semibold">{item.value}</p>
              <p className="text-[0.7rem] text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
