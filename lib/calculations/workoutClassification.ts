import type { Workout, WorkoutType } from "@/types/workout";

const crossTrainingTypes: WorkoutType[] = ["Peloton", "Bike", "Cross Training"];
const strengthTypes: WorkoutType[] = ["Strength"];
const restTypes: WorkoutType[] = ["Rest"];
const qualityTypes: WorkoutType[] = [
  "Tempo",
  "Threshold",
  "Intervals",
  "Track",
  "Hill Repeats",
  "Marathon Pace",
  "Progression",
  "Fartlek",
  "Race",
];

export function isCrossTrainingType(workoutType: WorkoutType) {
  return crossTrainingTypes.includes(workoutType);
}

export function isStrengthType(workoutType: WorkoutType) {
  return strengthTypes.includes(workoutType);
}

export function isRestType(workoutType: WorkoutType) {
  return restTypes.includes(workoutType);
}

export function isQualityType(workoutType: WorkoutType) {
  return qualityTypes.includes(workoutType);
}

export function isRunningWorkout(workout: Workout) {
  return workout.miles > 0 && !workout.isCrossTraining && !workout.isRest;
}

export function deriveWorkoutFlags(workoutType: WorkoutType, miles: number) {
  return {
    isLongRun: workoutType === "Long Run",
    isCrossTraining: isCrossTrainingType(workoutType),
    isStrength: isStrengthType(workoutType),
    isRest: isRestType(workoutType) || (workoutType === "Rest" && miles === 0),
  };
}

export function clampSpeedMiles(miles: number, speedMiles: number) {
  return Math.min(Math.max(speedMiles, 0), Math.max(miles, 0));
}
