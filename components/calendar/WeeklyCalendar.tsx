"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarDays, Flag, Footprints } from "lucide-react";
import { DayCard } from "@/components/calendar/DayCard";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { WorkoutEditSheet } from "@/components/calendar/WorkoutEditSheet";
import { getNextWorkout, getWeeklyMileage } from "@/lib/calculations/weeklyMetrics";
import { addWeeksToDate, getMonday, getWeekDays, getWeekLabel, toIsoDate } from "@/lib/dates/weekUtils";
import {
  getStoredWorkoutsSnapshot,
  saveStoredWorkouts,
  subscribeToStoredWorkouts,
} from "@/lib/storage/localWorkouts";
import { createWorkout, getSampleWorkoutsForWeek } from "@/lib/storage/sampleWorkouts";
import type { Workout } from "@/types/workout";

const raceDate = new Date("2026-10-11T12:00:00");
const raceName = "Chicago Marathon 2026";

function createBlankWorkout(date: string): Workout {
  return createWorkout({
    date,
    workoutType: "Rest",
    title: "No workout planned",
    miles: 0,
    notes: "",
  });
}

export function WeeklyCalendar() {
  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => getMonday(today), [today]);
  const [weekStart, setWeekStart] = useState(currentWeekStart);
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekLabel = useMemo(() => getWeekLabel(weekStart), [weekStart]);
  const workoutsByDate = useMemo(
    () => new Map(workouts.map((workout) => [workout.date, workout])),
    [workouts]
  );
  const visibleWorkouts = useMemo(
    () =>
      weekDays
        .map((day) => workoutsByDate.get(day.isoDate))
        .filter((workout): workout is Workout => Boolean(workout)),
    [weekDays, workoutsByDate]
  );
  const weeklyMileage = getWeeklyMileage(visibleWorkouts);
  const nextWorkout = getNextWorkout(workouts, toIsoDate(today));
  const daysToRace = Math.max(0, differenceInCalendarDays(raceDate, today));
  const selectedDay = selectedDate
    ? weekDays.find((day) => day.isoDate === selectedDate)
    : undefined;
  const selectedWorkout = selectedDate
    ? workoutsByDate.get(selectedDate) ?? createBlankWorkout(selectedDate)
    : null;

  function updateWorkouts(nextWorkouts: Workout[]) {
    saveStoredWorkouts(nextWorkouts);
  }

  function handleSave(workout: Workout) {
    const nextWorkouts = [
      ...workouts.filter((currentWorkout) => currentWorkout.date !== workout.date),
      workout,
    ].sort((a, b) => a.date.localeCompare(b.date));

    updateWorkouts(nextWorkouts);
    setIsEditorOpen(false);
  }

  function openEditor(date: string) {
    setSelectedDate(date);
    setIsEditorOpen(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-24">
      <main className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-5">
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Goal race</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground">
                {raceName}
              </h1>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flag className="size-5" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Countdown
              </p>
              <p className="mt-1 text-2xl font-semibold">{daysToRace} days</p>
            </div>
            <div className="rounded-md bg-secondary p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Current week
              </p>
              <p className="mt-1 text-base font-semibold">{weekLabel}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <Footprints className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted-foreground">Week mileage</p>
            <p className="mt-1 text-3xl font-semibold">{weeklyMileage.toFixed(1)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted-foreground">Next workout</p>
            <p className="mt-1 truncate text-lg font-semibold">
              {nextWorkout ? `${format(new Date(`${nextWorkout.date}T12:00:00`), "EEE")}: ${nextWorkout.title}` : "Not planned"}
            </p>
          </div>
        </section>

        <section aria-labelledby="calendar-heading" className="space-y-3">
          <div>
            <h2 id="calendar-heading" className="text-lg font-semibold">
              Weekly calendar
            </h2>
            <p className="text-sm text-muted-foreground">Monday through Sunday</p>
          </div>

          <WeekNavigator
            label={weekLabel}
            onPreviousWeek={() => setWeekStart((current) => addWeeksToDate(current, -1))}
            onNextWeek={() => setWeekStart((current) => addWeeksToDate(current, 1))}
            onToday={() => setWeekStart(currentWeekStart)}
          />

          <div className="grid gap-2">
            {weekDays.map((day) => (
              <DayCard
                key={day.isoDate}
                day={day}
                workout={workoutsByDate.get(day.isoDate)}
                onSelect={() => openEditor(day.isoDate)}
              />
            ))}
          </div>
        </section>
      </main>

      <WorkoutEditSheet
        open={isEditorOpen}
        workout={selectedWorkout}
        displayDate={selectedDay ? `${selectedDay.dayName}, ${selectedDay.displayDate}` : ""}
        resetKey={selectedWorkout?.id ?? "empty"}
        onOpenChange={setIsEditorOpen}
        onSave={handleSave}
      />
    </div>
  );
}
