import type { Workout } from "@/types/workout";
import type { MileageTrendPoint, WeeklyMetrics } from "@/types/metrics";
import { addWeeksToDate, getWeekDays, parseIsoDate, toIsoDate } from "@/lib/dates/weekUtils";
import { getRiskFlags } from "./riskFlags";
import {
  isCrossTrainingType,
  isRestType,
  isRunningWorkout,
  isStrengthType,
} from "./workoutClassification";

export function getWeeklyMileage(workouts: Workout[]) {
  return workouts
    .filter(isRunningWorkout)
    .reduce((total, workout) => total + workout.miles, 0);
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function getPercentage(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return roundToTenth((part / total) * 100);
}

function getWorkoutSpeedMiles(workout: Workout) {
  if (!isRunningWorkout(workout)) {
    return 0;
  }

  return roundToTenth(
    Math.min(Math.max(workout.speedMiles, 0), workout.miles)
  );
}

function getLongRunMiles(runningWorkouts: Workout[]) {
  const explicitLongRuns = runningWorkouts.filter((workout) => workout.isLongRun);
  const candidates = explicitLongRuns.length > 0 ? explicitLongRuns : runningWorkouts;

  return candidates.reduce(
    (highest, workout) => Math.max(highest, workout.miles),
    0
  );
}

function getMileageChangePercentage(totalMiles: number, priorWeekTotalMiles?: number) {
  if (priorWeekTotalMiles === undefined) {
    return undefined;
  }

  if (priorWeekTotalMiles === 0) {
    return totalMiles > 0 ? 100 : 0;
  }

  return roundToTenth(((totalMiles - priorWeekTotalMiles) / priorWeekTotalMiles) * 100);
}

export function getWeeklyMetrics(
  weekWorkouts: Workout[],
  options: {
    weekStartDate: string;
    priorWeekWorkouts?: Workout[];
  }
): WeeklyMetrics {
  const weekStart = parseIsoDate(options.weekStartDate);
  const weekDays = getWeekDays(weekStart);
  const weekDayDates = new Set(weekDays.map((day) => day.isoDate));
  const workouts = weekWorkouts.filter((workout) => weekDayDates.has(workout.date));
  const runningWorkouts = workouts.filter(isRunningWorkout);
  const totalMiles = roundToTenth(getWeeklyMileage(workouts));
  const speedMiles = roundToTenth(
    runningWorkouts.reduce((total, workout) => total + getWorkoutSpeedMiles(workout), 0)
  );
  const longRunMiles = roundToTenth(getLongRunMiles(runningWorkouts));
  const priorWeekRunningWorkouts = options.priorWeekWorkouts?.filter(isRunningWorkout);
  const priorWeekTotalMiles =
    options.priorWeekWorkouts === undefined
      ? undefined
      : roundToTenth(getWeeklyMileage(options.priorWeekWorkouts));
  const priorWeekLongRunMiles = priorWeekRunningWorkouts
    ? roundToTenth(getLongRunMiles(priorWeekRunningWorkouts))
    : undefined;

  const metricsWithoutFlags = {
    weekStartDate: options.weekStartDate,
    weekEndDate: weekDays[6].isoDate,
    totalMiles,
    speedMiles,
    speedPercentage: getPercentage(speedMiles, totalMiles),
    longRunMiles,
    longRunPercentage: getPercentage(longRunMiles, totalMiles),
    runningDays: runningWorkouts.length,
    restDays: workouts.filter(
      (workout) => workout.isRest || isRestType(workout.workoutType)
    ).length,
    crossTrainingDays: workouts.filter(
      (workout) => workout.isCrossTraining || isCrossTrainingType(workout.workoutType)
    ).length,
    strengthDays: workouts.filter(
      (workout) => workout.isStrength || isStrengthType(workout.workoutType)
    ).length,
    qualitySessionCount: runningWorkouts.filter((workout) => getWorkoutSpeedMiles(workout) > 0)
      .length,
    mileageChangePercentage: getMileageChangePercentage(totalMiles, priorWeekTotalMiles),
  };

  return {
    ...metricsWithoutFlags,
    riskFlags: getRiskFlags({
      ...metricsWithoutFlags,
      priorWeekLongRunMiles,
    }),
  };
}

export function getWorkoutsForWeek(workouts: Workout[], weekStartDate: string) {
  const weekDates = new Set(getWeekDays(parseIsoDate(weekStartDate)).map((day) => day.isoDate));

  return workouts.filter((workout) => weekDates.has(workout.date));
}

export function getWeeklyMetricsRange(
  workouts: Workout[],
  startWeekDate: string,
  endDate: string
) {
  const metrics: WeeklyMetrics[] = [];
  let weekStart = parseIsoDate(startWeekDate);
  const endWeekStart = parseIsoDate(toIsoDate(parseIsoDate(endDate)));

  while (weekStart <= endWeekStart) {
    const weekStartDate = toIsoDate(weekStart);
    const priorWeekStartDate = toIsoDate(addWeeksToDate(weekStart, -1));

    metrics.push(
      getWeeklyMetrics(getWorkoutsForWeek(workouts, weekStartDate), {
        weekStartDate,
        priorWeekWorkouts: getWorkoutsForWeek(workouts, priorWeekStartDate),
      })
    );

    weekStart = addWeeksToDate(weekStart, 1);
  }

  return metrics;
}

export function getMileageTrendPoints(metrics: WeeklyMetrics[]): MileageTrendPoint[] {
  return metrics.map((weekMetrics) => ({
    weekStartDate: weekMetrics.weekStartDate,
    label: weekMetrics.weekStartDate.slice(5).replace("-", "/"),
    miles: weekMetrics.totalMiles,
  }));
}

export function getNextWorkout(workouts: Workout[], todayIso: string) {
  return [...workouts]
    .filter((workout) => workout.date >= todayIso && !workout.isRest)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}
