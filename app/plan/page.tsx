export default function PlanPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-28 pt-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 1</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Plan</h1>
      </div>
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-base font-medium">Plan entry is not implemented yet.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Text parsing and parsed previews begin in Phase 4. This screen is present
          so the mobile app shell has a stable navigation target.
        </p>
      </section>
    </main>
  );
}
