export default function MetricsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-28 pt-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 1</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Metrics</h1>
      </div>
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-base font-medium">Weekly metrics placeholder</p>
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
  );
}
