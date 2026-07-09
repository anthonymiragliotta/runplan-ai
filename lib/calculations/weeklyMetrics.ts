import type { Workout } from "@/types/workout";
import { isRunningWorkout } from "./workoutClassification";

export function getWeeklyMileage(workouts: Workout[]) {
  return workouts
    .filter(isRunningWorkout)
    .reduce((total, workout) => total + workout.miles, 0);
}

export function getNextWorkout(workouts: Workout[], todayIso: string) {
  return [...workouts]
    .filter((workout) => workout.date >= todayIso && !workout.isRest)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}
