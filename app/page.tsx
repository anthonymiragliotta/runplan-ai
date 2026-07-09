import { addDays, differenceInCalendarDays, format, startOfWeek } from "date-fns";
import { CalendarDays, Flag, Footprints, TrendingUp } from "lucide-react";

const raceDate = new Date("2026-10-11T12:00:00");
const raceName = "Chicago Marathon 2026";

function getCurrentWeek() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);

    return {
      day: format(date, "EEE"),
      date: format(date, "MMM d"),
      isToday: format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
    };
  });
}

export default function Home() {
  const week = getCurrentWeek();
  const today = new Date();
  const daysToRace = Math.max(0, differenceInCalendarDays(raceDate, today));
  const weekLabel = `${week[0].date} - ${week[6].date}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-24">
      <main className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-5">
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
            <p className="mt-1 text-3xl font-semibold">0.0</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-sm text-muted-foreground">Next workout</p>
            <p className="mt-1 text-lg font-semibold">Not planned</p>
          </div>
        </section>

        <section aria-labelledby="calendar-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="calendar-heading" className="text-lg font-semibold">
                Weekly calendar
              </h2>
              <p className="text-sm text-muted-foreground">Monday through Sunday</p>
            </div>
            <span className="rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Placeholder
            </span>
          </div>

          <div className="grid gap-2">
            {week.map((day) => (
              <article
                key={`${day.day}-${day.date}`}
                className="grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold">{day.day}</p>
                  <p className="text-xs text-muted-foreground">{day.date}</p>
                </div>
                <div className="flex min-h-14 items-center justify-between gap-3 rounded-md bg-secondary px-3">
                  <div>
                    <p className="text-sm font-medium">No workout planned</p>
                    <p className="text-xs text-muted-foreground">
                      Calendar editing starts in Phase 2
                    </p>
                  </div>
                  {day.isToday ? (
                    <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      Today
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="metrics-heading" className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
              <TrendingUp className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <h2 id="metrics-heading" className="text-lg font-semibold">
                Weekly metrics
              </h2>
              <p className="text-sm text-muted-foreground">Placeholder for Phase 3</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {["Miles", "Speed %", "Long run %"].map((metric) => (
              <div key={metric} className="rounded-md bg-secondary p-3">
                <p className="text-xl font-semibold">--</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
