import type { Workout, WorkoutType } from "@/types/workout";
import { deriveWorkoutFlags } from "@/lib/calculations/workoutClassification";

const PLAN_ID = "local-plan";

type SampleWorkoutInput = {
  date: string;
  workoutType: WorkoutType;
  title: string;
  miles: number;
  speedMiles?: number;
  notes?: string;
  details?: Workout["details"];
};

export function createWorkout(input: SampleWorkoutInput): Workout {
  const now = new Date().toISOString();
  const flags = deriveWorkoutFlags(input.workoutType, input.miles);

  return {
    id: `${PLAN_ID}-${input.date}`,
    planId: PLAN_ID,
    date: input.date,
    workoutType: input.workoutType,
    title: input.title,
    miles: input.miles,
    speedMiles: input.speedMiles ?? 0,
    ...flags,
    details: input.details ?? {},
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSampleWorkoutsForWeek(weekDates: string[]) {
  return [
    createWorkout({
      date: weekDates[0],
      workoutType: "Easy",
      title: "5 Easy",
      miles: 5,
      notes: "Comfortable aerobic miles.",
    }),
    createWorkout({
      date: weekDates[1],
      workoutType: "Easy",
      title: "6 Easy",
      miles: 6,
    }),
    createWorkout({
      date: weekDates[2],
      workoutType: "Tempo",
      title: "2 up, 4 tempo, 2 down",
      miles: 8,
      speedMiles: 4,
      notes: "Tempo from 6:30 down toward 6:15.",
      details: {
        warmupMiles: 2,
        tempoMiles: 4,
        cooldownMiles: 2,
        paceStart: "6:30",
        paceEnd: "6:15",
      },
    }),
    createWorkout({
      date: weekDates[3],
      workoutType: "Peloton",
      title: "Peloton Easy Ride",
      miles: 0,
      notes: "Easy spin day.",
      details: {
        description: "Easy ride",
      },
    }),
    createWorkout({
      date: weekDates[4],
      workoutType: "Easy",
      title: "5 Easy",
      miles: 5,
    }),
    createWorkout({
      date: weekDates[5],
      workoutType: "Long Run",
      title: "14 Long",
      miles: 14,
      notes: "Steady long run.",
    }),
    createWorkout({
      date: weekDates[6],
      workoutType: "Rest",
      title: "Off",
      miles: 0,
      notes: "Complete rest day.",
    }),
  ];
}
