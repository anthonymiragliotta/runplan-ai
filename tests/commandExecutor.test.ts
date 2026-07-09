import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveWorkoutDate } from "@/lib/dates/resolveWorkoutDate";
import { applyCommand } from "@/lib/plan/applyCommand";
import { createWorkout } from "@/lib/storage/sampleWorkouts";
import type { CommandWorkoutPayload, PlanCommand } from "@/types/commands";

const emptyDetails: CommandWorkoutPayload["details"] = {
  warmupMiles: null,
  cooldownMiles: null,
  tempoMiles: null,
  thresholdMiles: null,
  marathonPaceMiles: null,
  intervalReps: null,
  intervalDistance: null,
  intervalRecovery: null,
  paceStart: null,
  paceEnd: null,
  durationMinutes: null,
  description: null,
};

function command(overrides: Partial<PlanCommand>): PlanCommand {
  return {
    intent: "UNKNOWN",
    confidence: 0.9,
    targetDayName: null,
    targetDate: null,
    sourceDayName: null,
    sourceDate: null,
    secondTargetDayName: null,
    secondTargetDate: null,
    scaleFactor: null,
    workouts: [],
    explanation: "Test command",
    ambiguities: [],
    warnings: [],
    ...overrides,
  };
}

function workoutPayload(overrides: Partial<CommandWorkoutPayload>): CommandWorkoutPayload {
  return {
    dayName: null,
    date: null,
    workoutType: null,
    title: null,
    miles: null,
    speedMiles: null,
    details: emptyDetails,
    notes: null,
    ...overrides,
    details: {
      ...emptyDetails,
      ...overrides.details,
    },
  };
}

describe("resolveWorkoutDate", () => {
  it("resolves weekday names against a Monday active week", () => {
    assert.equal(resolveWorkoutDate("Wednesday", "2026-07-13"), "2026-07-15");
    assert.equal(resolveWorkoutDate("Sunday", "2026-07-13"), "2026-07-19");
  });
});

describe("applyCommand", () => {
  it("applies MOVE_WORKOUT deterministically", () => {
    const saturdayLongRun = createWorkout({
      date: "2026-07-18",
      workoutType: "Long Run",
      title: "14 Long",
      miles: 14,
    });

    const result = applyCommand({
      activeWeekStartDate: "2026-07-13",
      existingWorkouts: [saturdayLongRun],
      command: command({
        intent: "MOVE_WORKOUT",
        sourceDayName: "Saturday",
        targetDayName: "Sunday",
      }),
    });

    assert.equal(result.canApply, true);
    assert.equal(result.updatedWorkouts.length, 1);
    assert.equal(result.updatedWorkouts[0].date, "2026-07-19");
    assert.equal(result.updatedWorkouts[0].title, "14 Long");
  });

  it("applies DELETE_WORKOUT deterministically", () => {
    const fridayRun = createWorkout({
      date: "2026-07-17",
      workoutType: "Easy",
      title: "4 Easy",
      miles: 4,
    });

    const result = applyCommand({
      activeWeekStartDate: "2026-07-13",
      existingWorkouts: [fridayRun],
      command: command({
        intent: "DELETE_WORKOUT",
        targetDayName: "Friday",
      }),
    });

    assert.equal(result.canApply, true);
    assert.equal(result.updatedWorkouts.length, 0);
    assert.equal(result.proposedChanges[0].action, "delete");
  });

  it("applies CREATE_OR_UPDATE_WORKOUTS deterministically", () => {
    const result = applyCommand({
      activeWeekStartDate: "2026-07-13",
      existingWorkouts: [],
      command: command({
        intent: "CREATE_OR_UPDATE_WORKOUTS",
        explanation: "Create Monday and Wednesday.",
        workouts: [
          workoutPayload({
            dayName: "Monday",
            workoutType: "Easy",
            miles: 5,
          }),
          workoutPayload({
            dayName: "Wednesday",
            workoutType: "Tempo",
            details: {
              warmupMiles: 2,
              tempoMiles: 4,
              cooldownMiles: 2,
            },
          }),
        ],
      }),
    });

    const monday = result.updatedWorkouts.find((workout) => workout.date === "2026-07-13");
    const wednesday = result.updatedWorkouts.find((workout) => workout.date === "2026-07-15");

    assert.equal(result.canApply, true);
    assert.equal(monday?.miles, 5);
    assert.equal(wednesday?.miles, 8);
    assert.equal(wednesday?.speedMiles, 4);
  });

  it("preserves existing speed miles when a command changes only total miles", () => {
    const tuesdayWorkout = createWorkout({
      date: "2026-07-14",
      workoutType: "Tempo",
      title: "2 up, 3 tempo, 1 down",
      miles: 6,
      speedMiles: 3,
      details: {
        warmupMiles: 2,
        tempoMiles: 3,
        cooldownMiles: 1,
      },
    });

    const result = applyCommand({
      activeWeekStartDate: "2026-07-13",
      existingWorkouts: [tuesdayWorkout],
      command: command({
        intent: "UPDATE_WORKOUT",
        targetDayName: "Tuesday",
        workouts: [
          workoutPayload({
            miles: 7,
          }),
        ],
      }),
    });

    assert.equal(result.updatedWorkouts[0].miles, 7);
    assert.equal(result.updatedWorkouts[0].speedMiles, 3);
  });

  it("does not mutate the original workout array", () => {
    const tuesdayWorkout = createWorkout({
      date: "2026-07-14",
      workoutType: "Easy",
      title: "6 Easy",
      miles: 6,
    });
    const originalWorkouts = [tuesdayWorkout];
    const originalSnapshot = JSON.stringify(originalWorkouts);

    applyCommand({
      activeWeekStartDate: "2026-07-13",
      existingWorkouts: originalWorkouts,
      command: command({
        intent: "UPDATE_WORKOUT",
        targetDayName: "Tuesday",
        workouts: [
          workoutPayload({
            miles: 7,
          }),
        ],
      }),
    });

    assert.equal(JSON.stringify(originalWorkouts), originalSnapshot);
  });
});
