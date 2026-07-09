"use client";

import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

type WeekNavigatorProps = {
  label: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
};

export function WeekNavigator({
  label,
  onPreviousWeek,
  onNextWeek,
  onToday,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        onClick={onPreviousWeek}
        aria-label="Previous week"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <div className="min-w-0 text-center">
        <p className="text-xs font-medium uppercase text-muted-foreground">Week</p>
        <p className="truncate text-base font-semibold">{label}</p>
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={onToday}
          aria-label="Go to current week"
        >
          <CalendarClock className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={onNextWeek}
          aria-label="Next week"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
