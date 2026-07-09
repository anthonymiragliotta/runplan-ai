import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAutoApplyVoiceEdit,
  createVoiceUndoSnapshot,
  restoreVoiceUndoSnapshot,
} from "@/lib/plan/voiceAutoApply";
import { createWorkout } from "@/lib/storage/sampleWorkouts";
import type { PlanCommand, PlanPreviewResult, ProposedWorkoutChange } from "@/types/commands";
import type { Workout } from "@/types/workout";

function command(overrides: Partial<PlanCommand>): PlanCommand {
  return {
    intent: "UPDATE_WORKOUT",
    confidence: 0.95,
    targetDayName: null,
    targetDate: null,
    sourceDayName: null,
    sourceDate: null,
    secondTargetDayName: null,
    secondTargetDate: null,
    scaleFactor: null,
    workouts: [],
    explanation: "Updated Tuesday.",
    ambiguities: [],
    warnings: [],
    ...overrides,
  };
}

function change(overrides: Partial<ProposedWorkoutChange>): ProposedWorkoutChange {
  return {
    id: "change-1",
    action: "upsert",
    date: "2026-07-14",
    sourceDate: null,
    targetDate: null,
    dayLabel: "Tuesday",
    summary: "Update Tuesday.",
    workout: null,
    beforeWorkout: null,
    afterWorkout: null,
    ...overrides,
  };
}

function parsedPlan(overrides: Partial<PlanPreviewResult>): PlanPreviewResult {
  const nextCommand = command({});
  nextCommand.intent = overrides.intent ?? nextCommand.intent;
  nextCommand.confidence = overrides.confidence ?? nextCommand.confidence;
  nextCommand.ambiguities = overrides.ambiguities ?? nextCommand.ambiguities;
  nextCommand.warnings = overrides.warnings ?? nextCommand.warnings;

  return {
    intent: nextCommand.intent,
    confidence: nextCommand.confidence,
    command: nextCommand,
    proposedChanges: [change({})],
    updatedWorkouts: [],
    previewSummary: "Updated Tuesday.",
    ambiguities: nextCommand.ambiguities,
    warnings: nextCommand.warnings,
    canApply: true,
    ...overrides,
  };
}

function canAutoApply(parsedPlanOverride: Partial<PlanPreviewResult>) {
  return canAutoApplyVoiceEdit({
    parsedPlan: parsedPlan(parsedPlanOverride),
    inputSource: "voice",
    autoApplyEnabled: true,
  });
}

describe("canAutoApplyVoiceEdit", () => {
  it("allows safe high-confidence voice updates", () => {
    assert.equal(canAutoApply({ intent: "UPDATE_WORKOUT", confidence: 0.95 }), true);
  });

  it("never auto-applies delete commands", () => {
    assert.equal(
      canAutoApply({
        intent: "DELETE_WORKOUT",
        proposedChanges: [change({ action: "delete" })],
      }),
      false
    );
  });

  it("never auto-applies create/update week commands", () => {
    assert.equal(
      canAutoApply({
        intent: "CREATE_OR_UPDATE_WORKOUTS",
        proposedChanges: [
          change({ date: "2026-07-13" }),
          change({ id: "change-2", date: "2026-07-15" }),
        ],
      }),
      false
    );
  });

  it("never auto-applies low-confidence parses", () => {
    assert.equal(canAutoApply({ confidence: 0.89 }), false);
  });

  it("never auto-applies commands with ambiguities", () => {
    assert.equal(canAutoApply({ ambiguities: ["Which Wednesday?"] }), false);
  });

  it("never auto-applies high-severity warnings", () => {
    assert.equal(canAutoApply({ warnings: ["High: mileage jump"] }), false);
  });

  it("never auto-applies commands affecting more than two days", () => {
    assert.equal(
      canAutoApply({
        intent: "UPDATE_WORKOUT",
        proposedChanges: [
          change({ date: "2026-07-13" }),
          change({ id: "change-2", date: "2026-07-14" }),
          change({ id: "change-3", date: "2026-07-15" }),
        ],
      }),
      false
    );
  });

  it("requires voice input and the stored preference", () => {
    const safePlan = parsedPlan({ intent: "MOVE_WORKOUT", confidence: 0.93 });

    assert.equal(
      canAutoApplyVoiceEdit({
        parsedPlan: safePlan,
        inputSource: "manual",
        autoApplyEnabled: true,
      }),
      false
    );
    assert.equal(
      canAutoApplyVoiceEdit({
        parsedPlan: safePlan,
        inputSource: "voice",
        autoApplyEnabled: false,
      }),
      false
    );
  });
});

describe("voice auto-apply undo snapshots", () => {
  it("undo restores prior workouts without sharing nested details", () => {
    const priorWorkouts: Workout[] = [
      createWorkout({
        date: "2026-07-14",
        workoutType: "Tempo",
        title: "6 Tempo",
        miles: 6,
        details: { tempoMiles: 3 },
      }),
    ];

    const snapshot = createVoiceUndoSnapshot(priorWorkouts);
    priorWorkouts[0].details.tempoMiles = 4;

    const restored = restoreVoiceUndoSnapshot(snapshot);

    assert.equal(restored[0].title, "6 Tempo");
    assert.equal(restored[0].details.tempoMiles, 3);
    assert.notEqual(restored[0], snapshot[0]);
    assert.notEqual(restored[0].details, snapshot[0].details);
  });
});
