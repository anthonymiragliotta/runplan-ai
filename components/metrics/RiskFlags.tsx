import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RiskFlag } from "@/types/metrics";

type RiskFlagsProps = {
  flags: RiskFlag[];
};

export function RiskFlags({ flags }: RiskFlagsProps) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm" aria-labelledby="risk-flags">
      <div className="flex items-center justify-between gap-3">
        <h2 id="risk-flags" className="text-lg font-semibold">
          Risk flags
        </h2>
        <Badge variant={flags.length > 0 ? "outline" : "secondary"}>
          {flags.length > 0 ? `${flags.length} active` : "Clear"}
        </Badge>
      </div>

      {flags.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-md bg-secondary p-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No risk flags for this week.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-start gap-3 rounded-md border p-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <Badge variant={flag.severity === "high" ? "destructive" : "outline"}>
                  {flag.severity}
                </Badge>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{flag.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
