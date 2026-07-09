import { addDays } from "date-fns";
import { parseIsoDate, toIsoDate } from "@/lib/dates/weekUtils";

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function resolveWorkoutDate(dayName: string, activeWeekStartDate: string) {
  const normalizedDay = dayName.trim().toLowerCase();
  const weekdayIndex = weekdays.indexOf(normalizedDay);

  if (weekdayIndex === -1) {
    return null;
  }

  return toIsoDate(addDays(parseIsoDate(activeWeekStartDate), weekdayIndex));
}

export function getDayNameForDate(date: string) {
  const index = Math.max(
    0,
    Math.min(6, Math.round((parseIsoDate(date).getDay() + 6) % 7))
  );

  return weekdays[index][0].toUpperCase() + weekdays[index].slice(1);
}
