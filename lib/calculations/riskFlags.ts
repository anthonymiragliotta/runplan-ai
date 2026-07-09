import type { RiskFlag, WeeklyMetrics } from "@/types/metrics";

type RiskFlagInput = Omit<WeeklyMetrics, "riskFlags"> & {
  priorWeekLongRunMiles?: number;
};

function createRiskFlag(
  type: RiskFlag["type"],
  severity: RiskFlag["severity"],
  message: string
): RiskFlag {
  return {
    id: type.toLowerCase(),
    type,
    severity,
    message,
  };
}

export function getRiskFlags(metrics: RiskFlagInput): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (
    metrics.mileageChangePercentage !== undefined &&
    metrics.mileageChangePercentage > 15
  ) {
    flags.push(
      createRiskFlag(
        "MILEAGE_JUMP",
        "warning",
        `Weekly mileage is up ${metrics.mileageChangePercentage.toFixed(1)}% from last week.`
      )
    );
  }

  if (metrics.totalMiles > 0 && metrics.longRunPercentage > 35) {
    flags.push(
      createRiskFlag(
        "LONG_RUN_SHARE",
        "warning",
        `Long run is ${metrics.longRunPercentage.toFixed(1)}% of weekly mileage.`
      )
    );
  }

  if (metrics.totalMiles > 0 && metrics.speedPercentage > 20) {
    flags.push(
      createRiskFlag(
        "SPEED_SHARE",
        "warning",
        `Speed work is ${metrics.speedPercentage.toFixed(1)}% of weekly mileage.`
      )
    );
  }

  if (metrics.restDays === 0) {
    flags.push(
      createRiskFlag("NO_REST_DAY", "info", "This week has no planned rest day.")
    );
  }

  if (metrics.qualitySessionCount > 2) {
    flags.push(
      createRiskFlag(
        "MULTIPLE_QUALITY_DAYS",
        "warning",
        `This week has ${metrics.qualitySessionCount} quality sessions.`
      )
    );
  }

  if (
    metrics.priorWeekLongRunMiles !== undefined &&
    metrics.longRunMiles - metrics.priorWeekLongRunMiles > 2
  ) {
    flags.push(
      createRiskFlag(
        "LONG_RUN_JUMP",
        "warning",
        `Long run increased by ${(metrics.longRunMiles - metrics.priorWeekLongRunMiles).toFixed(1)} miles.`
      )
    );
  }

  return flags;
}
