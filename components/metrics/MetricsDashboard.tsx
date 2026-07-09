"use client";

import { useMemo } from "react";
import { addWeeksToDate, toIsoDate } from "@/lib/dates/weekUtils";
import {
  getMileageTrendPoints,
  getWeeklyMetrics,
  getWeeklyMetricsRange,
  getWorkoutsForWeek,
} from "@/lib/calculations/weeklyMetrics";
import { useWorkouts } from "@/lib/storage/useWorkouts";
import { WeeklySummaryCard } from "@/components/metrics/WeeklySummaryCard";
import { MileageTrendChart } from "@/components/metrics/MileageTrendChart";
import { RiskFlags } from "@/components/metrics/RiskFlags";

const raceDate = "2026-10-11";

export function MetricsDashboard() {
  const { workouts, currentWeekStart } = useWorkouts();
  const currentWeekStartDate = toIsoDate(currentWeekStart);

  const currentMetrics = useMemo(() => {
    const priorWeekStartDate = toIsoDate(addWeeksToDate(currentWeekStart, -1));

    return getWeeklyMetrics(getWorkoutsForWeek(workouts, currentWeekStartDate), {
      weekStartDate: currentWeekStartDate,
      priorWeekWorkouts: getWorkoutsForWeek(workouts, priorWeekStartDate),
    });
  }, [currentWeekStart, currentWeekStartDate, workouts]);

  const trendData = useMemo(
    () =>
      getMileageTrendPoints(
        getWeeklyMetricsRange(workouts, currentWeekStartDate, raceDate)
      ),
    [currentWeekStartDate, workouts]
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-28 pt-6">
      <WeeklySummaryCard metrics={currentMetrics} />
      <MileageTrendChart data={trendData} />
      <RiskFlags flags={currentMetrics.riskFlags} />
    </main>
  );
}
