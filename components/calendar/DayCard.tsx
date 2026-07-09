"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WeekDay } from "@/lib/dates/weekUtils";
import type { Workout } from "@/types/workout";

type DayCardProps = {
  day: WeekDay;
  workout?: Workout;
  onSelect: () => void;
};

function formatMiles(miles?: number) {
  if (!miles) {
    return "0 mi";
  }

  return `${Number.isInteger(miles) ? miles.toFixed(0) : miles.toFixed(1)} mi`;
}

export function DayCard({ day, workout, onSelect }: DayCardProps) {
  const workoutType = workout?.workoutType ?? "Rest";
  const title = workout?.title || "No workout planned";
  const notes = workout?.notes || "Tap to add details";
  const isQuality = Boolean(workout && workout.speedMiles > 0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid min-h-28 w-full grid-cols-[4.25rem_1fr] gap-3 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        day.isToday && "border-primary/60"
      )}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-sm font-semibold">{day.dayShort}</p>
          <p className="text-xs text-muted-foreground">{day.displayDate}</p>
        </div>
        {day.isToday ? (
          <Badge className="rounded-md" variant="default">
            Today
          </Badge>
        ) : null}
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{workoutType}</p>
          </div>
          <p className="shrink-0 text-lg font-semibold">{formatMiles(workout?.miles)}</p>
        </div>

        <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{notes}</p>

        <div className="flex flex-wrap gap-1.5">
          {isQuality ? (
            <Badge variant="outline">{formatMiles(workout?.speedMiles)} speed</Badge>
          ) : null}
          {workout?.isLongRun ? <Badge variant="secondary">Long run</Badge> : null}
          {workout?.isCrossTraining ? <Badge variant="secondary">Cross-training</Badge> : null}
          {workout?.isStrength ? <Badge variant="secondary">Strength</Badge> : null}
          {workout?.isRest ? <Badge variant="secondary">Rest</Badge> : null}
        </div>
      </div>
    </button>
  );
}
