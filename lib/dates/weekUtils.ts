import { addDays, format, parseISO, startOfWeek } from "date-fns";

export type WeekDay = {
  date: Date;
  isoDate: string;
  dayName: string;
  dayShort: string;
  displayDate: string;
  isToday: boolean;
};

export function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function getMonday(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDays(weekStartDate: Date): WeekDay[] {
  const todayIso = toIsoDate(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStartDate, index);
    const isoDate = toIsoDate(date);

    return {
      date,
      isoDate,
      dayName: format(date, "EEEE"),
      dayShort: format(date, "EEE"),
      displayDate: format(date, "MMM d"),
      isToday: isoDate === todayIso,
    };
  });
}

export function addWeeksToDate(date: Date, amount: number) {
  return addDays(date, amount * 7);
}

export function parseIsoDate(date: string) {
  return parseISO(`${date}T12:00:00`);
}

export function getWeekLabel(weekStartDate: Date) {
  const weekEndDate = addDays(weekStartDate, 6);

  return `${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d")}`;
}
