"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, HelpCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanPreviewResult, ProposedWorkoutChange } from "@/types/commands";

type ParsedPreviewProps = {
  parsedPlan: PlanPreviewResult;
};

function formatDate(date: string | null) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function ChangeIcon({ action }: { action: ProposedWorkoutChange["action"] }) {
  if (action === "move") {
    return <ArrowRight className="size-4" aria-hidden="true" />;
  }

  if (action === "delete") {
    return <Trash2 className="size-4" aria-hidden="true" />;
  }

  return <CheckCircle2 className="size-4" aria-hidden="true" />;
}

function getChangeDateLabel(change: ProposedWorkoutChange) {
  if (change.action === "move" || change.action === "swap") {
    return `${formatDate(change.sourceDate)} to ${formatDate(change.targetDate)}`;
  }

  return formatDate(change.date);
}

export function ParsedPreview({ parsedPlan }: ParsedPreviewProps) {
  return (
    <section aria-labelledby="preview-heading" className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Preview</p>
          <h2 id="preview-heading" className="mt-1 text-lg font-semibold">
            {parsedPlan.previewSummary}
          </h2>
        </div>
        <Badge variant={parsedPlan.confidence >= 0.75 ? "default" : "outline"}>
          {Math.round(parsedPlan.confidence * 100)}%
        </Badge>
      </div>

      <div className="mt-4 grid gap-2">
        {parsedPlan.proposedChanges.map((change) => (
          <div key={change.id} className="rounded-md border bg-background p-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground",
                  change.action === "delete" && "text-destructive"
                )}
              >
                <ChangeIcon action={change.action} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{getChangeDateLabel(change)}</p>
                  <Badge variant="outline">{change.action}</Badge>
                </div>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {change.summary}
                </p>
                {change.afterWorkout ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{change.afterWorkout.workoutType}</Badge>
                    <Badge variant="secondary">{change.afterWorkout.miles} mi</Badge>
                    {change.afterWorkout.speedMiles > 0 ? (
                      <Badge variant="outline">{change.afterWorkout.speedMiles} speed</Badge>
                    ) : null}
                    {change.afterWorkout.isStrength ? (
                      <Badge variant="outline">Strength</Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {parsedPlan.ambiguities.length > 0 ? (
        <div className="mt-4 rounded-md border bg-secondary p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="size-4" aria-hidden="true" />
            Ambiguities
          </div>
          <ul className="mt-2 grid gap-1 text-sm leading-5 text-muted-foreground">
            {parsedPlan.ambiguities.map((ambiguity) => (
              <li key={ambiguity}>{ambiguity}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsedPlan.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Warnings
          </div>
          <ul className="mt-2 grid gap-1 text-sm leading-5">
            {parsedPlan.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
