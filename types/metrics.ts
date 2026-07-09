export type RiskFlag = {
  id: string;
  severity: "info" | "warning" | "high";
  type:
    | "MILEAGE_JUMP"
    | "LONG_RUN_SHARE"
    | "SPEED_SHARE"
    | "NO_REST_DAY"
    | "MULTIPLE_QUALITY_DAYS"
    | "LONG_RUN_JUMP";
  message: string;
};

export type WeeklyMetrics = {
  weekStartDate: string;
  weekEndDate: string;
  totalMiles: number;
  speedMiles: number;
  speedPercentage: number;
  longRunMiles: number;
  longRunPercentage: number;
  runningDays: number;
  restDays: number;
  crossTrainingDays: number;
  strengthDays: number;
  qualitySessionCount: number;
  mileageChangePercentage?: number;
  riskFlags: RiskFlag[];
};

export type MileageTrendPoint = {
  weekStartDate: string;
  label: string;
  miles: number;
};
