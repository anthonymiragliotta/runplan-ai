"use client";

import { FormEvent, useMemo, useState } from "react";
import { addWeeksToDate, getMonday, getWeekDays, getWeekLabel, toIsoDate } from "@/lib/dates/weekUtils";
import { useWorkouts } from "@/lib/storage/useWorkouts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { ParsedPreview } from "@/components/plan-entry/ParsedPreview";
import type { PlanPreviewResult } from "@/types/commands";
import { Check, Loader2, Sparkles, X } from "lucide-react";

const raceDate = "2026-10-11";

export function PlanEntryBox() {
  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => getMonday(today), [today]);
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [inputText, setInputText] = useState("");
  const [parsedPlan, setParsedPlan] = useState<PlanPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);
  const { workouts, saveWorkouts } = useWorkouts();

  const activeWeekStartDate = toIsoDate(weekStart);
  const weekLabel = getWeekLabel(weekStart);
  const visibleWeekDates = useMemo(
    () => new Set(getWeekDays(weekStart).map((day) => day.isoDate)),
    [weekStart]
  );
  const visibleWorkoutCount = workouts.filter((workout) =>
    visibleWeekDates.has(workout.date)
  ).length;

  async function handleParse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAppliedMessage(null);
    setParsedPlan(null);

    const trimmedInput = inputText.trim();

    if (!trimmedInput) {
      setError("Enter a plan update first.");
      return;
    }

    setIsParsing(true);

    try {
      const response = await fetch("/api/parse-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText: trimmedInput,
          activeWeekStartDate,
          existingWorkouts: workouts,
          raceDate,
        }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setError(responseBody.error ?? "Could not parse the plan update.");
        return;
      }

      setParsedPlan(responseBody as PlanPreviewResult);
    } catch {
      setError("Could not reach the parser route.");
    } finally {
      setIsParsing(false);
    }
  }

  function handleApply() {
    if (!parsedPlan) {
      return;
    }

    if (!parsedPlan.canApply) {
      setError("Clarify this update before applying changes.");
      return;
    }

    saveWorkouts(parsedPlan.updatedWorkouts);
    setAppliedMessage("Changes saved to this device.");
    setParsedPlan(null);
  }

  function handleCancelPreview() {
    setParsedPlan(null);
    setAppliedMessage(null);
    setError(null);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-28 pt-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 4</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Plan</h1>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-sm font-medium text-muted-foreground">Active week</p>
          <p className="mt-1 text-lg font-semibold">{weekLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {visibleWorkoutCount} planned days
          </p>
        </div>
        <WeekNavigator
          label={weekLabel}
          onPreviousWeek={() => setWeekStart((current) => addWeeksToDate(current, -1))}
          onNextWeek={() => setWeekStart((current) => addWeeksToDate(current, 1))}
          onToday={() => setWeekStart(currentWeekStart)}
        />
      </section>

      <form className="rounded-lg border bg-card p-4 shadow-sm" onSubmit={handleParse}>
        <label className="grid gap-2 text-sm font-medium">
          Plan update
          <Textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Monday 5 easy, Wednesday 2 warmup 4 tempo 2 cooldown, Sunday off"
            className="min-h-36 text-base"
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm leading-5 text-destructive">
            {error}
          </p>
        ) : null}

        {appliedMessage ? (
          <p className="mt-3 rounded-md border bg-secondary p-3 text-sm leading-5">
            {appliedMessage}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-4 w-full" disabled={isParsing}>
          {isParsing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          Parse update
        </Button>
      </form>

      {parsedPlan ? (
        <>
          <ParsedPreview parsedPlan={parsedPlan} />
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="lg" onClick={handleCancelPreview}>
              <X className="size-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleApply}
              disabled={!parsedPlan.canApply}
            >
              <Check className="size-4" aria-hidden="true" />
              Apply
            </Button>
          </div>
        </>
      ) : null}
    </main>
  );
}
