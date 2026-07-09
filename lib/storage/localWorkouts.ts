import type { Workout } from "@/types/workout";

const STORAGE_KEY = "runplan-ai.workouts.v1";
const STORAGE_EVENT = "runplan-ai.workouts.updated";

let cachedRawWorkouts: string | null = null;
let cachedWorkouts: Workout[] | null = null;

export function loadStoredWorkouts() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawWorkouts = window.localStorage.getItem(STORAGE_KEY);

  if (!rawWorkouts) {
    return null;
  }

  try {
    return JSON.parse(rawWorkouts) as Workout[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveStoredWorkouts(workouts: Workout[]) {
  const rawWorkouts = JSON.stringify(workouts);
  cachedRawWorkouts = rawWorkouts;
  cachedWorkouts = workouts;
  window.localStorage.setItem(STORAGE_KEY, rawWorkouts);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function subscribeToStoredWorkouts(onStoreChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function getStoredWorkoutsSnapshot(fallbackWorkouts: Workout[]) {
  if (typeof window === "undefined") {
    return fallbackWorkouts;
  }

  const rawWorkouts = window.localStorage.getItem(STORAGE_KEY);

  if (!rawWorkouts) {
    return fallbackWorkouts;
  }

  if (rawWorkouts === cachedRawWorkouts && cachedWorkouts) {
    return cachedWorkouts;
  }

  try {
    cachedRawWorkouts = rawWorkouts;
    cachedWorkouts = JSON.parse(rawWorkouts) as Workout[];
    return cachedWorkouts;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    cachedRawWorkouts = null;
    cachedWorkouts = null;
    return fallbackWorkouts;
  }
}
