import { clampSpeedMiles, deriveWorkoutFlags } from "@/lib/calculations/workoutClassification";
import { resolveWorkoutDate } from "@/lib/dates/resolveWorkoutDate";
import { getWeekDays, parseIsoDate } from "@/lib/dates/weekUtils";
import { createWorkout } from "@/lib/storage/sampleWorkouts";
import type {
  CommandWorkoutPayload,
  PlanCommand,
  PlanPreviewResult,
  ProposedWorkoutChange,
} from "@/types/commands";
import type { Workout, WorkoutDetails, WorkoutType } from "@/types/workout";

const emptyPreview = (command: PlanCommand, existingWorkouts: Workout[]): PlanPreviewResult => ({
  intent: command.intent,
  confidence: command.confidence,
  command,
  proposedChanges: [
    {
      id: "clarify-command",
      action: "clarify",
      date: null,
      sourceDate: null,
      targetDate: null,
      dayLabel: null,
      summary: command.explanation || "I need more detail before changing the plan.",
      workout: null,
      beforeWorkout: null,
      afterWorkout: null,
    },
  ],
  updatedWorkouts: existingWorkouts.map((workout) => ({ ...workout })),
  previewSummary: command.explanation || "Please clarify the plan update.",
  ambiguities: command.ambiguities.length
    ? command.ambiguities
    : ["Please clarify the workout change."],
  warnings: command.warnings,
  canApply: false,
});

function normalizeDate(date: string | null, dayName: string | null, activeWeekStartDate: string) {
  if (date) {
    return date;
  }

  if (!dayName) {
    return null;
  }

  return resolveWorkoutDate(dayName, activeWeekStartDate);
}

function cleanDetails(details: CommandWorkoutPayload["details"]) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== null && value !== undefined)
  ) as WorkoutDetails;
}

function inferWorkoutType(payload: CommandWorkoutPayload, existingWorkout?: Workout): WorkoutType {
  if (payload.workoutType) {
    return payload.workoutType;
  }

  if (payload.details.tempoMiles) {
    return "Tempo";
  }

  if (payload.details.thresholdMiles) {
    return "Threshold";
  }

  if (payload.details.marathonPaceMiles) {
    return "Marathon Pace";
  }

  if (payload.miles !== null) {
    return existingWorkout?.workoutType ?? "Easy";
  }

  return existingWorkout?.workoutType ?? "Custom";
}

function inferTotalMiles(payload: CommandWorkoutPayload, existingWorkout?: Workout) {
  if (payload.miles !== null) {
    return Math.max(payload.miles, 0);
  }

  if (
    payload.workoutType === "Rest" ||
    payload.workoutType === "Peloton" ||
    payload.workoutType === "Bike" ||
    payload.workoutType === "Cross Training" ||
    payload.workoutType === "Strength"
  ) {
    return 0;
  }

  const segmentMiles = [
    payload.details.warmupMiles,
    payload.details.tempoMiles,
    payload.details.thresholdMiles,
    payload.details.marathonPaceMiles,
    payload.details.cooldownMiles,
  ].reduce<number>((total, value) => total + (value ?? 0), 0);

  if (segmentMiles > 0) {
    return segmentMiles;
  }

  return existingWorkout?.miles ?? 0;
}

function inferSpeedMiles(payload: CommandWorkoutPayload, miles: number, existingWorkout?: Workout) {
  if (payload.speedMiles !== null) {
    return clampSpeedMiles(miles, payload.speedMiles);
  }

  const qualityMiles =
    (payload.details.tempoMiles ?? 0) +
    (payload.details.thresholdMiles ?? 0) +
    (payload.details.marathonPaceMiles ?? 0);

  if (qualityMiles > 0) {
    return clampSpeedMiles(miles, qualityMiles);
  }

  return clampSpeedMiles(miles, existingWorkout?.speedMiles ?? 0);
}

function buildTitle(payload: CommandWorkoutPayload, workoutType: WorkoutType, miles: number) {
  if (payload.title?.trim()) {
    return payload.title.trim();
  }

  if (workoutType === "Rest") {
    return "Off";
  }

  if (workoutType === "Peloton" || workoutType === "Bike" || workoutType === "Cross Training") {
    return payload.details.description ?? workoutType;
  }

  return miles > 0 ? `${Number.isInteger(miles) ? miles.toFixed(0) : miles} ${workoutType}` : workoutType;
}

function workoutFromPayload(
  date: string,
  payload: CommandWorkoutPayload,
  existingWorkout?: Workout
) {
  const workoutType = inferWorkoutType(payload, existingWorkout);
  const miles = inferTotalMiles(payload, existingWorkout);
  const speedMiles = inferSpeedMiles(payload, miles, existingWorkout);
  const details = {
    ...(existingWorkout?.details ?? {}),
    ...cleanDetails(payload.details),
  };
  const now = new Date().toISOString();
  const createdWorkout = createWorkout({
    date,
    workoutType,
    title: buildTitle(payload, workoutType, miles),
    miles,
    speedMiles,
    notes: payload.notes ?? existingWorkout?.notes,
    details,
  });
  const derivedFlags = deriveWorkoutFlags(workoutType, miles);

  return {
    ...createdWorkout,
    id: existingWorkout?.id ?? createdWorkout.id,
    planId: existingWorkout?.planId ?? createdWorkout.planId,
    createdAt: existingWorkout?.createdAt ?? createdWorkout.createdAt,
    updatedAt: now,
    isLongRun: derivedFlags.isLongRun,
    isCrossTraining: derivedFlags.isCrossTraining,
    isStrength:
      derivedFlags.isStrength ||
      Boolean(
        payload.details.durationMinutes &&
          /lift|strength/i.test(`${payload.notes ?? ""} ${payload.details.description ?? ""}`)
      ),
    isRest: derivedFlags.isRest,
  };
}

function setWorkout(workoutsByDate: Map<string, Workout>, workout: Workout) {
  workoutsByDate.set(workout.date, workout);
}

function createChange(
  change: Omit<ProposedWorkoutChange, "id">,
  index: number
): ProposedWorkoutChange {
  return {
    id: `${change.action}-${change.date ?? change.targetDate ?? change.sourceDate ?? index}`,
    ...change,
  };
}

function getWorkoutDateFromPayload(
  payload: CommandWorkoutPayload,
  command: PlanCommand,
  activeWeekStartDate: string
) {
  return normalizeDate(
    payload.date ?? command.targetDate,
    payload.dayName ?? command.targetDayName,
    activeWeekStartDate
  );
}

export function applyCommand({
  command,
  activeWeekStartDate,
  existingWorkouts,
}: {
  command: PlanCommand;
  activeWeekStartDate: string;
  existingWorkouts: Workout[];
}): PlanPreviewResult {
  const originalWorkouts = existingWorkouts.map((workout) => ({
    ...workout,
    details: { ...workout.details },
  }));

  if (command.confidence < 0.45 || command.intent === "UNKNOWN") {
    return emptyPreview(command, originalWorkouts);
  }

  const workoutsByDate = new Map(originalWorkouts.map((workout) => [workout.date, workout]));
  const proposedChanges: ProposedWorkoutChange[] = [];

  if (command.intent === "CREATE_OR_UPDATE_WORKOUTS" || command.intent === "UPDATE_WORKOUT") {
    command.workouts.forEach((payload, index) => {
      const date = getWorkoutDateFromPayload(payload, command, activeWeekStartDate);

      if (!date) {
        proposedChanges.push(
          createChange(
            {
              action: "clarify",
              date: null,
              sourceDate: null,
              targetDate: null,
              dayLabel: payload.dayName,
              summary: "Workout date could not be resolved.",
              workout: null,
              beforeWorkout: null,
              afterWorkout: null,
            },
            index
          )
        );
        return;
      }

      const beforeWorkout = workoutsByDate.get(date) ?? null;
      const afterWorkout = workoutFromPayload(date, payload, beforeWorkout ?? undefined);
      setWorkout(workoutsByDate, afterWorkout);
      proposedChanges.push(
        createChange(
          {
            action: "upsert",
            date,
            sourceDate: null,
            targetDate: null,
            dayLabel: payload.dayName,
            summary: `${date}: ${afterWorkout.title}`,
            workout: afterWorkout,
            beforeWorkout,
            afterWorkout,
          },
          index
        )
      );
    });
  }

  if (command.intent === "MOVE_WORKOUT") {
    const sourceDate = normalizeDate(command.sourceDate, command.sourceDayName, activeWeekStartDate);
    const targetDate = normalizeDate(command.targetDate, command.targetDayName, activeWeekStartDate);
    const sourceWorkout = sourceDate ? workoutsByDate.get(sourceDate) : null;

    if (sourceDate && targetDate && sourceWorkout) {
      const now = new Date().toISOString();
      const movedWorkout = {
        ...sourceWorkout,
        id: `${sourceWorkout.planId}-${targetDate}`,
        date: targetDate,
        updatedAt: now,
      };
      workoutsByDate.delete(sourceDate);
      workoutsByDate.set(targetDate, movedWorkout);
      proposedChanges.push(
        createChange(
          {
            action: "move",
            date: targetDate,
            sourceDate,
            targetDate,
            dayLabel: `${command.sourceDayName ?? sourceDate} to ${command.targetDayName ?? targetDate}`,
            summary: `Move ${sourceWorkout.title} to ${targetDate}.`,
            workout: movedWorkout,
            beforeWorkout: sourceWorkout,
            afterWorkout: movedWorkout,
          },
          0
        )
      );
    }
  }

  if (command.intent === "DELETE_WORKOUT") {
    const date = normalizeDate(command.targetDate, command.targetDayName, activeWeekStartDate);
    const beforeWorkout = date ? workoutsByDate.get(date) ?? null : null;

    if (date) {
      workoutsByDate.delete(date);
      proposedChanges.push(
        createChange(
          {
            action: "delete",
            date,
            sourceDate: null,
            targetDate: null,
            dayLabel: command.targetDayName,
            summary: beforeWorkout ? `Delete ${beforeWorkout.title}.` : `Clear ${date}.`,
            workout: null,
            beforeWorkout,
            afterWorkout: null,
          },
          0
        )
      );
    }
  }

  if (command.intent === "SWAP_WORKOUTS") {
    const firstDate = normalizeDate(command.targetDate, command.targetDayName, activeWeekStartDate);
    const secondDate = normalizeDate(
      command.secondTargetDate,
      command.secondTargetDayName,
      activeWeekStartDate
    );
    const firstWorkout = firstDate ? workoutsByDate.get(firstDate) ?? null : null;
    const secondWorkout = secondDate ? workoutsByDate.get(secondDate) ?? null : null;

    if (firstDate && secondDate) {
      workoutsByDate.delete(firstDate);
      workoutsByDate.delete(secondDate);

      if (firstWorkout) {
        workoutsByDate.set(secondDate, {
          ...firstWorkout,
          id: `${firstWorkout.planId}-${secondDate}`,
          date: secondDate,
          updatedAt: new Date().toISOString(),
        });
      }

      if (secondWorkout) {
        workoutsByDate.set(firstDate, {
          ...secondWorkout,
          id: `${secondWorkout.planId}-${firstDate}`,
          date: firstDate,
          updatedAt: new Date().toISOString(),
        });
      }

      proposedChanges.push(
        createChange(
          {
            action: "swap",
            date: null,
            sourceDate: firstDate,
            targetDate: secondDate,
            dayLabel: `${command.targetDayName ?? firstDate} and ${command.secondTargetDayName ?? secondDate}`,
            summary: `Swap workouts for ${firstDate} and ${secondDate}.`,
            workout: null,
            beforeWorkout: firstWorkout,
            afterWorkout: secondWorkout,
          },
          0
        )
      );
    }
  }

  if (command.intent === "SCALE_WEEK" && command.scaleFactor !== null) {
    const activeWeekDates = new Set(
      getWeekDays(parseIsoDate(activeWeekStartDate)).map((day) => day.isoDate)
    );

    originalWorkouts
      .filter((workout) => activeWeekDates.has(workout.date))
      .filter((workout) => !workout.isRest && !workout.isCrossTraining && !workout.isStrength)
      .forEach((workout, index) => {
        const miles = Math.max(0, Number((workout.miles * command.scaleFactor!).toFixed(1)));
        const speedMiles = clampSpeedMiles(
          miles,
          Number((workout.speedMiles * command.scaleFactor!).toFixed(1))
        );
        const afterWorkout = {
          ...workout,
          miles,
          speedMiles,
          title: workout.title.replace(/\d+(\.\d+)?/, String(miles)),
          updatedAt: new Date().toISOString(),
        };
        workoutsByDate.set(afterWorkout.date, afterWorkout);
        proposedChanges.push(
          createChange(
            {
              action: "scale",
              date: workout.date,
              sourceDate: null,
              targetDate: null,
              dayLabel: null,
              summary: `Scale ${workout.title} to ${miles} miles.`,
              workout: afterWorkout,
              beforeWorkout: workout,
              afterWorkout,
            },
            index
          )
        );
      });
  }

  const warnings = [...command.warnings];

  if (proposedChanges.length === 0) {
    warnings.push("No deterministic workout changes could be produced from this command.");
  }

  const canApply = proposedChanges.length > 0 && proposedChanges.every((change) => change.action !== "clarify");
  const updatedWorkouts = Array.from(workoutsByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    intent: command.intent,
    confidence: command.confidence,
    command,
    proposedChanges,
    updatedWorkouts,
    previewSummary: canApply
      ? command.explanation || `${proposedChanges.length} change proposed.`
      : "Please clarify before applying changes.",
    ambiguities: command.ambiguities,
    warnings,
    canApply,
  };
}
