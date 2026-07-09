export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-28 pt-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 1</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Settings</h1>
      </div>
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-base font-medium">Settings are not implemented yet.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Race configuration and data controls belong to later V1 work.
        </p>
      </section>
    </main>
  );
}
