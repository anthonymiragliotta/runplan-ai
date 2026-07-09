"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getMonday, getWeekDays } from "@/lib/dates/weekUtils";
import {
  getStoredWorkoutsSnapshot,
  saveStoredWorkouts,
  subscribeToStoredWorkouts,
} from "@/lib/storage/localWorkouts";
import { getSampleWorkoutsForWeek } from "@/lib/storage/sampleWorkouts";

export function useWorkouts() {
  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => getMonday(today), [today]);
  const seededWorkouts = useMemo(
    () =>
      getSampleWorkoutsForWeek(
        getWeekDays(currentWeekStart).map((day) => day.isoDate)
      ),
    [currentWeekStart]
  );

  const workouts = useSyncExternalStore(
    subscribeToStoredWorkouts,
    () => getStoredWorkoutsSnapshot(seededWorkouts),
    () => seededWorkouts
  );

  return {
    currentWeekStart,
    workouts,
    saveWorkouts: saveStoredWorkouts,
  };
}
