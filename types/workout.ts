export type WorkoutType =
  | "Easy"
  | "Recovery"
  | "Long Run"
  | "Tempo"
  | "Threshold"
  | "Intervals"
  | "Track"
  | "Hill Repeats"
  | "Marathon Pace"
  | "Progression"
  | "Fartlek"
  | "Race"
  | "Shakeout"
  | "Peloton"
  | "Bike"
  | "Cross Training"
  | "Strength"
  | "Rest"
  | "Custom";

export type WorkoutDetails = {
  warmupMiles?: number;
  cooldownMiles?: number;
  tempoMiles?: number;
  thresholdMiles?: number;
  marathonPaceMiles?: number;
  intervalReps?: number;
  intervalDistance?: string;
  intervalRecovery?: string;
  paceStart?: string;
  paceEnd?: string;
  durationMinutes?: number;
  description?: string;
};

export type Workout = {
  id: string;
  planId: string;
  date: string;
  workoutType: WorkoutType;
  title: string;
  miles: number;
  speedMiles: number;
  isLongRun: boolean;
  isCrossTraining: boolean;
  isStrength: boolean;
  isRest: boolean;
  details: WorkoutDetails;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export const WORKOUT_TYPES: WorkoutType[] = [
  "Easy",
  "Recovery",
  "Long Run",
  "Tempo",
  "Threshold",
  "Intervals",
  "Track",
  "Hill Repeats",
  "Marathon Pace",
  "Progression",
  "Fartlek",
  "Race",
  "Shakeout",
  "Peloton",
  "Bike",
  "Cross Training",
  "Strength",
  "Rest",
  "Custom",
];
