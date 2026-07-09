import type { PlanPreviewResult, ProposedWorkoutChange } from "@/types/commands";
import type { Workout } from "@/types/workout";

export type PlanInputSource = "manual" | "voice";

type VoiceAutoApplyInput = {
  parsedPlan: PlanPreviewResult;
  inputSource: PlanInputSource;
  autoApplyEnabled: boolean;
};

const SAFE_AUTO_APPLY_INTENTS = new Set([
  "UPDATE_WORKOUT",
  "MOVE_WORKOUT",
  "SWAP_WORKOUTS",
]);

function collectAffectedDates(change: ProposedWorkoutChange) {
  return [
    change.date,
    change.sourceDate,
    change.targetDate,
    change.beforeWorkout?.date ?? null,
    change.afterWorkout?.date ?? null,
  ].filter((date): date is string => Boolean(date));
}

export function getAffectedWorkoutDays(parsedPlan: PlanPreviewResult) {
  return new Set(parsedPlan.proposedChanges.flatMap(collectAffectedDates));
}

export function hasHighSeverityWarning(parsedPlan: PlanPreviewResult) {
  return parsedPlan.warnings.some((warning) => {
    const normalizedWarning = warning.trim().toLowerCase();

    return (
      normalizedWarning.startsWith("high:") ||
      normalizedWarning.startsWith("[high]") ||
      normalizedWarning.includes("high severity")
    );
  });
}

export function canAutoApplyVoiceEdit({
  parsedPlan,
  inputSource,
  autoApplyEnabled,
}: VoiceAutoApplyInput) {
  if (inputSource !== "voice" || !autoApplyEnabled) {
    return false;
  }

  if (!parsedPlan.canApply || parsedPlan.confidence < 0.9) {
    return false;
  }

  if (!SAFE_AUTO_APPLY_INTENTS.has(parsedPlan.intent)) {
    return false;
  }

  if (parsedPlan.ambiguities.length > 0 || hasHighSeverityWarning(parsedPlan)) {
    return false;
  }

  return getAffectedWorkoutDays(parsedPlan).size <= 2;
}

export function createVoiceUndoSnapshot(workouts: Workout[]) {
  return workouts.map((workout) => ({
    ...workout,
    details: { ...workout.details },
  }));
}

export function restoreVoiceUndoSnapshot(snapshot: Workout[]) {
  return createVoiceUndoSnapshot(snapshot);
}
