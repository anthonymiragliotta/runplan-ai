"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { clampSpeedMiles, deriveWorkoutFlags } from "@/lib/calculations/workoutClassification";
import type { Workout, WorkoutType } from "@/types/workout";
import { WORKOUT_TYPES } from "@/types/workout";

type WorkoutEditSheetProps = {
  open: boolean;
  workout: Workout | null;
  displayDate: string;
  resetKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (workout: Workout) => void;
};

type WorkoutFormState = {
  workoutType: WorkoutType;
  title: string;
  miles: string;
  speedMiles: string;
  notes: string;
  isLongRun: boolean;
  isCrossTraining: boolean;
  isStrength: boolean;
  isRest: boolean;
};

function toFormState(workout: Workout): WorkoutFormState {
  return {
    workoutType: workout.workoutType,
    title: workout.title,
    miles: String(workout.miles),
    speedMiles: String(workout.speedMiles),
    notes: workout.notes ?? "",
    isLongRun: workout.isLongRun,
    isCrossTraining: workout.isCrossTraining,
    isStrength: workout.isStrength,
    isRest: workout.isRest,
  };
}

function getNumberInput(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

export function WorkoutEditSheet({
  open,
  workout,
  displayDate,
  resetKey,
  onOpenChange,
  onSave,
}: WorkoutEditSheetProps) {
  if (!workout) {
    return null;
  }

  return (
    <WorkoutEditForm
      key={resetKey}
      open={open}
      workout={workout}
      displayDate={displayDate}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

function WorkoutEditForm({
  open,
  workout,
  displayDate,
  onOpenChange,
  onSave,
}: Omit<WorkoutEditSheetProps, "resetKey" | "workout"> & { workout: Workout }) {
  const [formState, setFormState] = useState<WorkoutFormState>(() => toFormState(workout));

  function updateForm(nextState: Partial<WorkoutFormState>) {
    setFormState((current) => (current ? { ...current, ...nextState } : current));
  }

  function handleTypeChange(workoutType: WorkoutType) {
    const miles = getNumberInput(formState?.miles ?? "0");
    updateForm({
      workoutType,
      ...deriveWorkoutFlags(workoutType, miles),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const miles = getNumberInput(formState.miles);
    const speedMiles = clampSpeedMiles(miles, getNumberInput(formState.speedMiles));
    const now = new Date().toISOString();

    onSave({
      ...workout,
      workoutType: formState.workoutType,
      title: formState.title.trim() || formState.workoutType,
      miles,
      speedMiles,
      isLongRun: formState.isLongRun,
      isCrossTraining: formState.isCrossTraining,
      isStrength: formState.isStrength,
      isRest: formState.isRest,
      notes: formState.notes.trim() || undefined,
      updatedAt: now,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-lg pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="pr-12">
          <SheetTitle>Edit Workout</SheetTitle>
          <SheetDescription>{displayDate}</SheetDescription>
        </SheetHeader>

        <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm font-medium">
            Workout type
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={formState.workoutType}
              onChange={(event) => handleTypeChange(event.target.value as WorkoutType)}
            >
              {WORKOUT_TYPES.map((workoutType) => (
                <option key={workoutType} value={workoutType}>
                  {workoutType}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Title
            <Input
              value={formState.title}
              onChange={(event) => updateForm({ title: event.target.value })}
              className="h-10"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-sm font-medium">
              Miles
              <Input
                inputMode="decimal"
                min="0"
                step="0.1"
                type="number"
                value={formState.miles}
                onChange={(event) => updateForm({ miles: event.target.value })}
                className="h-10"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Speed miles
              <Input
                inputMode="decimal"
                min="0"
                step="0.1"
                type="number"
                value={formState.speedMiles}
                onChange={(event) => updateForm({ speedMiles: event.target.value })}
                className="h-10"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium">
            Notes
            <Textarea
              value={formState.notes}
              onChange={(event) => updateForm({ notes: event.target.value })}
              className="min-h-24"
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Flags</legend>
            {[
              ["isLongRun", "Long run"],
              ["isCrossTraining", "Cross-training"],
              ["isStrength", "Strength"],
              ["isRest", "Rest"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-foreground"
                  checked={Boolean(formState[key as keyof WorkoutFormState])}
                  onChange={(event) =>
                    updateForm({
                      [key]: event.target.checked,
                    } as Partial<WorkoutFormState>)
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>

          <SheetFooter className="px-0">
            <Button type="submit" size="lg">
              <Save className="size-4" aria-hidden="true" />
              Save workout
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
