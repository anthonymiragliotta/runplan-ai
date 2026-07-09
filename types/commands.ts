import type { Workout, WorkoutDetails, WorkoutType } from "@/types/workout";

export type PlanCommandIntent =
  | "CREATE_OR_UPDATE_WORKOUTS"
  | "UPDATE_WORKOUT"
  | "MOVE_WORKOUT"
  | "DELETE_WORKOUT"
  | "SWAP_WORKOUTS"
  | "SCALE_WEEK"
  | "UNKNOWN";

export type CommandWorkoutPayload = {
  dayName: string | null;
  date: string | null;
  workoutType: WorkoutType | null;
  title: string | null;
  miles: number | null;
  speedMiles: number | null;
  details: {
    warmupMiles: number | null;
    cooldownMiles: number | null;
    tempoMiles: number | null;
    thresholdMiles: number | null;
    marathonPaceMiles: number | null;
    intervalReps: number | null;
    intervalDistance: string | null;
    intervalRecovery: string | null;
    paceStart: string | null;
    paceEnd: string | null;
    durationMinutes: number | null;
    description: string | null;
  };
  notes: string | null;
};

export type PlanCommand = {
  intent: PlanCommandIntent;
  confidence: number;
  targetDayName: string | null;
  targetDate: string | null;
  sourceDayName: string | null;
  sourceDate: string | null;
  secondTargetDayName: string | null;
  secondTargetDate: string | null;
  scaleFactor: number | null;
  workouts: CommandWorkoutPayload[];
  explanation: string;
  ambiguities: string[];
  warnings: string[];
};

export type ProposedWorkoutChange = {
  id: string;
  action: "upsert" | "move" | "delete" | "swap" | "scale" | "clarify";
  date: string | null;
  sourceDate: string | null;
  targetDate: string | null;
  dayLabel: string | null;
  summary: string;
  workout: Workout | null;
  beforeWorkout: Workout | null;
  afterWorkout: Workout | null;
};

export type PlanPreviewResult = {
  intent: PlanCommandIntent;
  confidence: number;
  command: PlanCommand;
  proposedChanges: ProposedWorkoutChange[];
  updatedWorkouts: Workout[];
  previewSummary: string;
  ambiguities: string[];
  warnings: string[];
  canApply: boolean;
};

export type ParsePlanRequest = {
  inputText: string;
  activeWeekStartDate: string;
  existingWorkouts: Workout[];
  raceDate: string;
};

export type ParsedCommandDetails = CommandWorkoutPayload["details"];
export type AppliedWorkoutDetails = WorkoutDetails;
