import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getWeeklyMetrics } from "@/lib/calculations/weeklyMetrics";
import { deriveWorkoutFlags } from "@/lib/calculations/workoutClassification";
import type { Workout, WorkoutType } from "@/types/workout";

function workout(input: {
  date: string;
  workoutType: WorkoutType;
  miles: number;
  speedMiles?: number;
  isLongRun?: boolean;
  details?: Workout["details"];
}): Workout {
  const flags = deriveWorkoutFlags(input.workoutType, input.miles);

  return {
    id: input.date,
    planId: "test-plan",
    date: input.date,
    workoutType: input.workoutType,
    title: input.workoutType,
    miles: input.miles,
    speedMiles: input.speedMiles ?? 0,
    ...flags,
    isLongRun: input.isLongRun ?? flags.isLongRun,
    details: input.details ?? {},
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("getWeeklyMetrics", () => {
  it("calculates weekly totals using Monday weeks and running-only mileage", () => {
    const metrics = getWeeklyMetrics(
      [
        workout({ date: "2026-07-06", workoutType: "Easy", miles: 5 }),
        workout({ date: "2026-07-07", workoutType: "Peloton", miles: 12 }),
        workout({ date: "2026-07-08", workoutType: "Strength", miles: 3 }),
        workout({ date: "2026-07-09", workoutType: "Tempo", miles: 8, speedMiles: 6, details: { warmupMiles: 2, cooldownMiles: 2 } }),
        workout({ date: "2026-07-11", workoutType: "Easy", miles: 14 }),
        workout({ date: "2026-07-12", workoutType: "Rest", miles: 0 }),
      ],
      {
        weekStartDate: "2026-07-06",
        priorWeekWorkouts: [
          workout({ date: "2026-06-29", workoutType: "Easy", miles: 10 }),
          workout({ date: "2026-07-05", workoutType: "Long Run", miles: 12 }),
        ],
      }
    );

    assert.equal(metrics.weekEndDate, "2026-07-12");
    assert.equal(metrics.totalMiles, 27);
    assert.equal(metrics.speedMiles, 6);
    assert.equal(metrics.speedPercentage, 22.2);
    assert.equal(metrics.longRunMiles, 14);
    assert.equal(metrics.longRunPercentage, 51.9);
    assert.equal(metrics.runningDays, 3);
    assert.equal(metrics.crossTrainingDays, 1);
    assert.equal(metrics.strengthDays, 1);
    assert.equal(metrics.restDays, 1);
    assert.equal(metrics.mileageChangePercentage, 22.7);
  });

  it("uses an explicit long run over the highest mileage fallback", () => {
    const metrics = getWeeklyMetrics(
      [
        workout({ date: "2026-07-06", workoutType: "Easy", miles: 10 }),
        workout({ date: "2026-07-11", workoutType: "Easy", miles: 8, isLongRun: true }),
      ],
      { weekStartDate: "2026-07-06" }
    );

    assert.equal(metrics.longRunMiles, 8);
  });

  it("uses edited speed miles instead of stale workout detail segment miles", () => {
    const metrics = getWeeklyMetrics(
      [
        workout({
          date: "2026-07-08",
          workoutType: "Tempo",
          miles: 8,
          speedMiles: 5,
          details: {
            warmupMiles: 2,
            tempoMiles: 4,
            cooldownMiles: 1,
          },
        }),
      ],
      { weekStartDate: "2026-07-06" }
    );

    assert.equal(metrics.speedMiles, 5);
    assert.equal(metrics.speedPercentage, 62.5);
  });

  it("does not subtract warmup and cooldown from an explicit speed miles value", () => {
    const metrics = getWeeklyMetrics(
      [
        workout({
          date: "2026-07-08",
          workoutType: "Intervals",
          miles: 18,
          speedMiles: 14,
          details: {
            warmupMiles: 3,
            cooldownMiles: 4,
          },
        }),
      ],
      { weekStartDate: "2026-07-06" }
    );

    assert.equal(metrics.speedMiles, 14);
    assert.equal(metrics.speedPercentage, 77.8);
  });

  it("counts explicit speed miles on long runs", () => {
    const metrics = getWeeklyMetrics(
      [
        workout({
          date: "2026-07-11",
          workoutType: "Long Run",
          miles: 22,
          speedMiles: 20,
        }),
      ],
      { weekStartDate: "2026-07-06" }
    );

    assert.equal(metrics.speedMiles, 20);
    assert.equal(metrics.speedPercentage, 90.9);
    assert.equal(metrics.qualitySessionCount, 1);
  });

  it("creates risk flags for threshold violations", () => {
    const metrics = getWeeklyMetrics(
      [
        workout({ date: "2026-07-06", workoutType: "Tempo", miles: 6, speedMiles: 3 }),
        workout({ date: "2026-07-07", workoutType: "Intervals", miles: 6, speedMiles: 3 }),
        workout({ date: "2026-07-08", workoutType: "Threshold", miles: 6, speedMiles: 3 }),
        workout({ date: "2026-07-11", workoutType: "Long Run", miles: 12 }),
      ],
      {
        weekStartDate: "2026-07-06",
        priorWeekWorkouts: [workout({ date: "2026-06-29", workoutType: "Long Run", miles: 9 })],
      }
    );

    assert.deepEqual(
      metrics.riskFlags.map((flag) => flag.type).sort(),
      [
        "LONG_RUN_JUMP",
        "LONG_RUN_SHARE",
        "MILEAGE_JUMP",
        "MULTIPLE_QUALITY_DAYS",
        "NO_REST_DAY",
        "SPEED_SHARE",
      ].sort()
    );
  });
});
